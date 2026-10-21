import http from "node:http";
import { timingSafeEqual } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { z } from "zod";
import { Auth, validAddress, validSignature } from "./auth.js";
import { Service } from "./service.js";
import { ApiError, requireThat, hash, id, now } from "./util.js";
import { tokenAccounts } from "./history.js";

const address = z.string().refine(validAddress, "Invalid Solana address");
const signature = z
  .string()
  .refine(validSignature, "Invalid transaction signature");
const cluster = z.enum(["mainnet-beta", "devnet"]).default("mainnet-beta");
const inputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("transaction"), signature, cluster }).strict(),
  z
    .object({
      kind: z.literal("presign"),
      payload: z.string().max(1700),
      cluster,
      intent: z
        .object({
          owner: address.optional(),
          maxSolLamports: z
            .string()
            .regex(/^\d{1,20}$/)
            .optional(),
        })
        .strict()
        .optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("wallet"),
      address,
      cluster,
      before: signature.optional(),
      limit: z.number().int().min(1).max(20).default(10),
    })
    .strict(),
]);
const json = (res, status, value) => {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(value));
};
const clean = (value) => {
  const { owner, file, ...rest } = value;
  return rest;
};
async function body(req) {
  requireThat(
    (req.headers["content-type"] || "").split(";")[0] === "application/json",
    415,
    "JSON_REQUIRED",
    "Send application/json.",
  );
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    requireThat(
      size <= 16384,
      413,
      "BODY_TOO_LARGE",
      "Request body is too large.",
    );
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Malformed JSON body.");
  }
}
function parse(schema, data) {
  const result = schema.safeParse(data);
  requireThat(
    result.success,
    400,
    "INVALID_INPUT",
    result.success
      ? ""
      : result.error.issues
          .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
          .join("; ")
          .slice(0, 500),
  );
  return result.data;
}

export function createApp(store, config, providers = {}) {
  const auth = new Auth(store, config),
    service = new Service(store, config, providers),
    rates = new Map();
  function limit(req) {
    const key = hash(req.socket.remoteAddress || "unknown"),
      minute = Math.floor(Date.now() / 60000);
    if (rates.size > 10000)
      for (const [k, v] of rates) if (v.minute !== minute) rates.delete(k);
    const row =
      rates.get(key)?.minute === minute ? rates.get(key) : { minute, count: 0 };
    requireThat(
      ++row.count <= 180,
      429,
      "RATE_LIMITED",
      "Too many requests. Retry in a minute.",
    );
    rates.set(key, row);
    return key;
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; media-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
    if (config.production)
      res.setHeader("Strict-Transport-Security", "max-age=31536000");
    const requestId = id().slice(0, 12);
    res.setHeader("X-Request-Id", requestId);
    try {
      const ip = limit(req),
        url = new URL(req.url, "http://local"),
        path = url.pathname;
      if (path === "/api/health" && req.method === "GET")
        return json(res, 200, { status: "ok", schemaVersion: 1 });
      if (req.method === "GET" && /^\/api\/shares\/[a-f0-9]{48}$/.test(path)) {
        const share = store.get("share", path.split("/")[3]);
        requireThat(share, 404, "NOT_FOUND", "Share not found.");
        return json(res, 200, { ...share.snapshot, sharedAt: share.createdAt });
      }
      if (!path.startsWith("/api/")) {
        requireThat(
          ["GET", "HEAD"].includes(req.method),
          405,
          "METHOD_NOT_ALLOWED",
          "Method not allowed.",
        );
        const root = resolve("dist");
        const candidate = resolve(root, `.${decodeURIComponent(path)}`);
        requireThat(
          candidate === root || candidate.startsWith(root + sep),
          404,
          "NOT_FOUND",
          "Not found.",
        );
        let file = candidate;
        try {
          if (!(await stat(file)).isFile()) file = resolve(root, "index.html");
        } catch {
          file = resolve(root, "index.html");
        }
        let info;
        try {
          info = await stat(file);
        } catch {
          throw new ApiError(
            404,
            "FRONTEND_NOT_BUILT",
            "Build the frontend or use the Vite development server.",
          );
        }
        const type =
          {
            ".html": "text/html; charset=utf-8",
            ".js": "text/javascript",
            ".css": "text/css",
            ".svg": "image/svg+xml",
            ".png": "image/png",
            ".woff2": "font/woff2",
          }[extname(file)] || "application/octet-stream";
        res.writeHead(200, {
          "Content-Type": type,
          "Content-Length": info.size,
        });
        if (req.method === "HEAD") return res.end();
        createReadStream(file)
          .on("error", () => res.destroy())
          .pipe(res);
        return;
      }
      const session = auth.session(req, res),
        owner = service.owner(session.owner);
      if (!["GET", "HEAD"].includes(req.method)) {
        requireThat(
          req.headers.origin === config.origin,
          403,
          "ORIGIN_REJECTED",
          "Request origin does not match APP_ORIGIN.",
        );
        requireThat(
          req.headers["x-csrf-token"] === session.csrf,
          403,
          "CSRF_REJECTED",
          "Refresh your session before submitting.",
        );
      }
      const quota = (category, max) => {
        store.consume(`ip:${ip}`, category, max * 3);
        store.consume(owner, category, max);
      };
      const walletRequired = () =>
        requireThat(
          session.wallet,
          401,
          "SIGN_IN_REQUIRED",
          "Sign in with your wallet to use saved account features.",
        );
      if (path === "/api/session" && req.method === "GET")
        return json(res, 200, {
          wallet: session.wallet,
          csrf: session.csrf,
          expiresAt: new Date(session.expires).toISOString(),
          usage: store.usage(owner),
          capabilities: {
            tinyfish: Boolean(config.tinyfishKey),
            generatedGlossary: Boolean(
              config.tinyfishKey && config.llmKey && config.llmUrl,
            ),
            video: service.videos.available(),
            historicalPrices: Boolean(config.marketKey),
          },
        });
      if (path === "/api/auth/challenge" && req.method === "POST") {
        quota("login", 30);
        const b = parse(z.object({ address }).strict(), await body(req));
        return json(res, 200, auth.challenge(session, b.address));
      }
      if (path === "/api/auth/verify" && req.method === "POST") {
        const b = parse(
          z.object({ signature: z.string().max(100) }).strict(),
          await body(req),
        );
        const next = auth.verify(session, b.signature, res);
        return json(res, 200, { wallet: next.wallet, csrf: next.csrf });
      }
      if (path === "/api/auth/logout" && req.method === "POST") {
        store.delete("session", session.id);
        store.delete("challenge", session.id);
        const next = auth.create(res);
        return json(res, 200, { wallet: null, csrf: next.csrf });
      }
      if (path === "/api/analyses" && req.method === "POST") {
        const input = parse(inputSchema, await body(req));
        quota("analysis", config.dailyJobs);
        return json(res, 202, clean(service.submit(owner, input)));
      }
      const jobMatch = path.match(/^\/api\/jobs\/([a-f0-9]{48})$/);
      if (jobMatch) {
        const job = service.owned("job", jobMatch[1], owner);
        if (req.method === "GET") return json(res, 200, clean(job));
        if (req.method === "DELETE") {
          service.queue.cancel(job.id);
          return json(res, 200, { status: "cancelled" });
        }
      }
      if (path === "/api/reports" && req.method === "GET")
        return json(res, 200, {
          reports: store
            .list("report", owner)
            .slice(0, 100)
            .map((r) => ({
              id: r.id,
              kind: r.kind,
              headline: r.explanation?.headline || "Wallet history",
              createdAt: r.createdAt,
              saved: Boolean(r.saved),
            })),
        });
      const reportMatch = path.match(
        /^\/api\/reports\/([a-f0-9]{48})(?:\/(save|share|video))?$/,
      );
      if (reportMatch) {
        const report = service.owned("report", reportMatch[1], owner),
          action = reportMatch[2];
        if (!action && req.method === "GET")
          return json(res, 200, clean(report));
        if (!action && req.method === "DELETE") {
          for (const share of store
            .list("share", owner)
            .filter((s) => s.reportId === report.id))
            store.delete("share", share.id);
          store.delete("report", report.id);
          return json(res, 200, { deleted: true });
        }
        if (action === "save" && req.method === "POST") {
          walletRequired();
          store.put("report", report.id, { ...report, saved: true }, owner);
          return json(res, 200, { saved: true });
        }
        if (action === "share" && req.method === "POST") {
          const b = parse(
            z.object({ publish: z.literal(true) }).strict(),
            await body(req),
          );
          quota("share", 30);
          return json(res, 201, service.share(report, owner));
        }
        if (action === "video" && req.method === "POST") {
          quota("video", 3);
          return json(res, 202, clean(service.video(report, owner)));
        }
      }
      const shareMatch = path.match(/^\/api\/shares\/([a-f0-9]{48})$/);
      if (shareMatch && req.method === "DELETE") {
        service.owned("share", shareMatch[1], owner);
        store.delete("share", shareMatch[1]);
        return json(res, 200, { deleted: true });
      }
      const videoMatch = path.match(
        /^\/api\/videos\/([a-f0-9]{48})(?:\/(download|play))?$/,
      );
      if (videoMatch && req.method === "GET") {
        const video = service.owned("video", videoMatch[1], owner);
        service.owned("report", video.reportId, owner);
        if (!videoMatch[2]) return json(res, 200, clean(video));
        const info = await stat(video.file);
        let start = 0,
          end = info.size - 1,
          partial = false;
        if (req.headers.range) {
          const range = req.headers.range.match(/^bytes=(\d+)-(\d*)$/);
          requireThat(range, 416, "INVALID_RANGE", "Unsupported byte range.");
          start = Number(range[1]);
          end = range[2] ? Number(range[2]) : end;
          requireThat(
            Number.isSafeInteger(start) &&
              Number.isSafeInteger(end) &&
              start <= end &&
              start >= 0 &&
              start < info.size,
            416,
            "INVALID_RANGE",
            "Invalid byte range.",
          );
          end = Math.min(end, info.size - 1);
          partial = true;
        }
        res.writeHead(partial ? 206 : 200, {
          "Content-Type": "video/mp4",
          "Content-Length": end - start + 1,
          "Accept-Ranges": "bytes",
          ...(partial
            ? { "Content-Range": `bytes ${start}-${end}/${info.size}` }
            : {}),
          "Content-Disposition": `${videoMatch[2] === "download" ? "attachment" : "inline"}; filename="trustlens-explainer.mp4"`,
        });
        createReadStream(video.file, { start, end })
          .on("error", () => res.destroy())
          .pipe(res);
        return;
      }
      if (path === "/api/glossary" && req.method === "GET")
        return json(res, 200, {
          entries: store
            .list("glossary")
            .filter((e) => ["curated", "approved"].includes(e.status)),
        });
      if (path === "/api/glossary/lookup" && req.method === "POST") {
        const b = parse(
          z.object({ term: z.string().min(1).max(60) }).strict(),
          await body(req),
        );
        quota("glossary", 60);
        return json(res, 200, await service.glossary.lookup(b.term));
      }
      if (path === "/api/admin/glossary/review" && req.method === "POST") {
        const supplied = (req.headers.authorization || "").replace(
          /^Bearer /,
          "",
        );
        requireThat(
          config.adminKey &&
            timingSafeEqual(
              Buffer.from(hash(supplied)),
              Buffer.from(hash(config.adminKey)),
            ),
          403,
          "ADMIN_REQUIRED",
          "Admin credentials required.",
        );
        const b = parse(
          z
            .object({
              id: z.string().max(100),
              status: z.enum(["approved", "retired"]),
            })
            .strict(),
          await body(req),
        );
        return json(res, 200, service.glossary.review(b.id, b.status));
      }
      if (path === "/api/admin/glossary" && req.method === "GET") {
        const supplied = (req.headers.authorization || "").replace(
          /^Bearer /,
          "",
        );
        requireThat(
          config.adminKey &&
            timingSafeEqual(
              Buffer.from(hash(supplied)),
              Buffer.from(hash(config.adminKey)),
            ),
          403,
          "ADMIN_REQUIRED",
          "Admin credentials required.",
        );
        return json(res, 200, {
          entries: store
            .list("glossary")
            .filter((e) => e.status === "generated_unreviewed"),
        });
      }
      if (path === "/api/research/agent" && req.method === "POST") {
        const b = parse(
          z
            .object({ identifier: address, url: z.string().url().max(2000) })
            .strict(),
          await body(req),
        );
        quota("agent", 3);
        return json(
          res,
          202,
          clean(
            service.queue.add(owner, "research", async (_stage, signal) =>
              service.research.agent(b.identifier, b.url, signal),
            ),
          ),
        );
      }
      if (path === "/api/wallet/token-accounts" && req.method === "POST") {
        const b = parse(
          z.object({ address, cluster }).strict(),
          await body(req),
        );
        quota("discovery", 10);
        return json(
          res,
          200,
          await tokenAccounts(service.rpc, b.cluster, b.address),
        );
      }
      if (path === "/api/watchlist") {
        walletRequired();
        if (req.method === "GET")
          return json(res, 200, {
            entries: store.list("watchlist", owner),
            monitoring: false,
          });
        if (req.method === "POST") {
          const b = parse(
            z
              .object({
                address,
                cluster,
                label: z.string().max(80).default(""),
              })
              .strict(),
            await body(req),
          );
          requireThat(
            store.list("watchlist", owner).length < 50,
            429,
            "WATCHLIST_FULL",
            "Watchlist limit is 50.",
          );
          const item = { ...b, id: id(), owner, createdAt: now() };
          store.put("watchlist", item.id, item, owner);
          return json(res, 201, clean(item));
        }
      }
      const watchMatch = path.match(/^\/api\/watchlist\/([a-f0-9]{48})$/);
      if (watchMatch && req.method === "DELETE") {
        walletRequired();
        service.owned("watchlist", watchMatch[1], owner);
        store.delete("watchlist", watchMatch[1]);
        return json(res, 200, { deleted: true });
      }
      if (path === "/api/preferences") {
        walletRequired();
        if (req.method === "GET")
          return json(
            res,
            200,
            store.get("preferences", owner) || {
              hideLikelySpam: true,
              glossaryMode: "beginner",
            },
          );
        if (req.method === "PUT") {
          const b = parse(
            z
              .object({
                hideLikelySpam: z.boolean(),
                glossaryMode: z.enum(["beginner", "minimal"]),
              })
              .strict(),
            await body(req),
          );
          store.put("preferences", owner, b, owner);
          return json(res, 200, b);
        }
      }
      throw new ApiError(404, "NOT_FOUND", "Endpoint not found.");
    } catch (error) {
      if (res.headersSent) return res.destroy();
      if (!(error instanceof ApiError))
        console.error(
          JSON.stringify({
            requestId,
            code: "INTERNAL_ERROR",
            name: error.name,
          }),
        );
      json(res, error instanceof ApiError ? error.status : 500, {
        error: {
          code: error.code || "INTERNAL_ERROR",
          message:
            error instanceof ApiError
              ? error.message
              : "Request failed. Please retry.",
          requestId,
        },
      });
    }
  });
  server.requestTimeout = 120000;
  server.headersTimeout = 15000;
  server.keepAliveTimeout = 5000;
  return { server, service, auth };
}
