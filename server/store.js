import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { ApiError, id, now } from "./util.js";

export class Store {
  constructor(path) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS records (kind TEXT NOT NULL, id TEXT NOT NULL, owner TEXT, data TEXT NOT NULL, updated TEXT NOT NULL, PRIMARY KEY(kind,id));
      CREATE INDEX IF NOT EXISTS records_owner ON records(kind,owner);
      CREATE TABLE IF NOT EXISTS usage (subject TEXT NOT NULL, day TEXT NOT NULL, category TEXT NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(subject,day,category));`);
  }
  put(kind, key, value, owner = null) {
    this.db
      .prepare(
        "INSERT INTO records VALUES(?,?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET owner=excluded.owner,data=excluded.data,updated=excluded.updated",
      )
      .run(kind, key, owner, JSON.stringify(value), now());
    return value;
  }
  get(kind, key) {
    const row = this.db
      .prepare("SELECT data FROM records WHERE kind=? AND id=?")
      .get(kind, key);
    return row ? JSON.parse(row.data) : null;
  }
  list(kind, owner) {
    return (
      owner === undefined
        ? this.db
            .prepare(
              "SELECT data FROM records WHERE kind=? ORDER BY updated DESC",
            )
            .all(kind)
        : this.db
            .prepare(
              "SELECT data FROM records WHERE kind=? AND owner=? ORDER BY updated DESC",
            )
            .all(kind, owner)
    ).map((row) => JSON.parse(row.data));
  }
  delete(kind, key) {
    this.db.prepare("DELETE FROM records WHERE kind=? AND id=?").run(kind, key);
  }
  consume(subject, category, limit) {
    if (limit < 1)
      throw new ApiError(429, "QUOTA_REACHED", "Daily request limit reached.");
    const day = now().slice(0, 10);
    const row = this.db
      .prepare(
        "INSERT INTO usage VALUES(?,?,?,1) ON CONFLICT(subject,day,category) DO UPDATE SET count=count+1 WHERE count < ? RETURNING count",
      )
      .get(subject, day, category, limit);
    if (!row || limit < 1)
      throw new ApiError(
        429,
        "QUOTA_REACHED",
        "Daily request limit reached. Try again tomorrow.",
      );
    return row.count;
  }
  usage(subject) {
    return this.db
      .prepare("SELECT category,count FROM usage WHERE subject=? AND day=?")
      .all(subject, now().slice(0, 10));
  }
  close() {
    this.db.close();
  }
}

export class Queue {
  constructor(store, concurrency = 2, limit = 20) {
    this.store = store;
    this.concurrency = concurrency;
    this.limit = limit;
    this.pending = [];
    this.active = 0;
    this.controllers = new Map();
    for (const job of store.list("job"))
      if (["queued", "running"].includes(job.status))
        store.put(
          "job",
          job.id,
          {
            ...job,
            status: "failed",
            error: {
              code: "SERVER_RESTARTED",
              message: "Server restarted. Submit a new job.",
            },
          },
          job.owner,
        );
  }
  add(owner, type, work) {
    if (this.pending.length + this.active >= this.limit)
      throw new ApiError(
        503,
        "QUEUE_FULL",
        "The analysis queue is full. Please retry later.",
      );
    const job = {
      id: id(),
      owner,
      type,
      status: "queued",
      stage: "queued",
      createdAt: now(),
    };
    this.store.put("job", job.id, job, owner);
    this.pending.push({ job, work });
    this.drain();
    return job;
  }
  cancel(jobId) {
    const job = this.store.get("job", jobId);
    if (job && ["queued", "running"].includes(job.status)) {
      this.store.put(
        "job",
        jobId,
        { ...job, status: "cancelled", stage: "cancelled" },
        job.owner,
      );
      this.controllers.get(jobId)?.abort();
    }
  }
  drain() {
    while (this.active < this.concurrency && this.pending.length) {
      const { job, work } = this.pending.shift();
      if (this.store.get("job", job.id).status === "cancelled") continue;
      this.active++;
      const controller = new AbortController();
      this.controllers.set(job.id, controller);
      const update = (patch) => {
        const old = this.store.get("job", job.id);
        if (old.status !== "cancelled")
          this.store.put("job", job.id, { ...old, ...patch }, old.owner);
      };
      update({ status: "running" });
      Promise.resolve()
        .then(() => work((stage) => update({ stage }), controller.signal))
        .then((result) =>
          update({
            status: "complete",
            stage: "complete",
            result,
            completedAt: now(),
          }),
        )
        .catch((error) =>
          update({
            status: "failed",
            error: {
              code: error.code || "JOB_FAILED",
              message:
                error instanceof ApiError
                  ? error.message
                  : "The job could not be completed.",
            },
          }),
        )
        .finally(() => {
          this.active--;
          this.controllers.delete(job.id);
          this.drain();
        });
    }
  }
}
