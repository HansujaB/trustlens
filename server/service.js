import { id, now, requireThat } from "./util.js";
import {
  Rpc,
  explainSignature,
  reviewPayload,
  findings,
  explanation,
  SYSTEM,
  TOKEN,
  COMPUTE,
  ATA,
} from "./solana.js";
import { Research } from "./research.js";
import { Glossary } from "./glossary.js";
import { Market, explainFailure } from "./market.js";
import { Videos } from "./video.js";
import { walletHistory } from "./history.js";
import { Queue } from "./store.js";

export class Service {
  constructor(store, config, providers = {}) {
    this.store = store;
    this.config = config;
    this.rpc = providers.rpc || new Rpc(config);
    this.research = providers.research || new Research(store, config);
    this.glossary =
      providers.glossary || new Glossary(store, this.research, config);
    this.market = providers.market || new Market(config);
    this.videos = providers.videos || new Videos(config);
    this.queue = new Queue(store, config.concurrency, config.maxQueue);
  }
  owner(owner) {
    return this.store.get("owner_alias", owner)?.owner || owner;
  }
  owned(kind, key, owner) {
    const item = this.store.get(kind, key);
    requireThat(
      item && this.owner(item.owner) === this.owner(owner),
      404,
      "NOT_FOUND",
      "Item not found.",
    );
    return item;
  }
  submit(owner, input) {
    return this.queue.add(owner, input.kind, async (stage, signal) => {
      stage("onchain");
      if (input.kind === "wallet") {
        const history = await walletHistory(this.rpc, input, signal);
        signal.throwIfAborted();
        const report = {
          id: id(),
          owner: this.owner(owner),
          kind: "wallet",
          createdAt: now(),
          history,
        };
        this.store.put("report", report.id, report, report.owner);
        return { reportId: report.id };
      }
      const review =
        input.kind === "presign"
          ? await reviewPayload(
              this.rpc,
              input.cluster,
              input.payload,
              input.intent,
              signal,
            )
          : {
              facts: await explainSignature(
                this.rpc,
                input.cluster,
                input.signature,
                signal,
              ),
            };
      const { facts, simulation } = review;
      stage("web-evidence");
      const routine = new Set([SYSTEM, TOKEN, COMPUTE, ATA]);
      const identifiers = [
        ...new Set([
          ...facts.programs.filter((p) => !routine.has(p)),
          ...facts.assetChanges.map((c) => c.mint).filter(Boolean),
          ...facts.instructions.map((i) => i.decoded.mint).filter(Boolean),
        ]),
      ].slice(0, 3);
      const research = [];
      for (const identifier of identifiers) {
        signal.throwIfAborted();
        research.push(
          await this.research.investigate(identifier, facts.cluster, signal),
        );
      }
      stage("explanation");
      const trade =
        input.kind === "transaction"
          ? await this.market.compare(facts, signal)
          : null;
      signal.throwIfAborted();
      const report = {
        id: id(),
        owner: this.owner(owner),
        kind: input.kind,
        createdAt: now(),
        facts,
        simulation,
        findings: findings(facts, simulation, input.intent),
        explanation: explanation(facts),
        failure: explainFailure(facts),
        trade,
        research,
        researchCoverage:
          "Up to three non-routine program or mint identifiers. Website mentions are context, not safety or identity certification.",
      };
      this.store.put("report", report.id, report, report.owner);
      return { reportId: report.id };
    });
  }
  share(report, owner) {
    requireThat(
      report.kind === "transaction",
      422,
      "SHARE_UNSUPPORTED",
      "Public sharing is available only for executed-transaction reports, not private wallet histories or unsigned payloads.",
    );
    const { owner: _, ...snapshot } = structuredClone(report);
    const share = {
      id: id(),
      owner: this.owner(owner),
      reportId: report.id,
      createdAt: now(),
      snapshot,
    };
    this.store.put("share", share.id, share, share.owner);
    return {
      id: share.id,
      url: `/share/${share.id}`,
      disclosure:
        "Anyone with this link can view the transaction addresses, amounts, findings, and source excerpts.",
    };
  }
  video(report, owner) {
    requireThat(
      this.videos.available(),
      503,
      "VIDEO_NOT_CONFIGURED",
      "Narrated video generation is not configured.",
    );
    const videoId = id();
    return this.queue.add(owner, "video", async (stage, signal) => {
      const rendered = await this.videos.render(report, videoId, stage, signal);
      signal.throwIfAborted();
      this.store.put(
        "video",
        videoId,
        {
          id: videoId,
          owner: this.owner(owner),
          reportId: report.id,
          createdAt: now(),
          ...rendered,
        },
        this.owner(owner),
      );
      return { videoId, url: `/api/videos/${videoId}/download` };
    });
  }
}
