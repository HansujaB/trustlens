import { useEffect, useRef, useState } from "react";
import { useWalletAuth } from "../lib/WalletAuth";
import { ArrowUpRight } from "lucide-react";
import { api, waitForJob } from "../lib/api";
import { Brand } from "./ui";
import { DEMO_SHARE_ID, buildDemoReport, demoShareUrl, isDemoMode } from "../lib/demoReport";

export function shortAddr(value) {
  const s = String(value || "");
  return s.length > 9 ? `${s.slice(0, 4)}…${s.slice(-4)}` : s;
}

export function formatRaw(raw, decimals = 9) {
  const n = BigInt(raw);
  const negative = n < 0n;
  const s = (negative ? -n : n).toString().padStart(decimals + 1, "0");
  return `${negative ? "-" : ""}${decimals ? `${s.slice(0, -decimals)}.${s.slice(-decimals)}`.replace(/\.?0+$/, "") : s}`;
}

/** Net per-owner, per-mint balance changes. Display-only grouping of facts. */
export function netMovements(assetChanges = []) {
  const totals = new Map();
  for (const c of assetChanges) {
    if (!c || c.owner == null || c.rawAmount == null) continue;
    const key = `${c.owner}|${c.mint || "SOL"}`;
    const prev = totals.get(key);
    if (prev && prev.decimals !== c.decimals) continue;
    totals.set(key, {
      owner: c.owner,
      mint: c.mint,
      symbol: c.symbol || (c.mint ? null : "SOL"),
      decimals: c.decimals,
      raw: (prev?.raw || 0n) + BigInt(c.rawAmount),
    });
  }
  return [...totals.values()]
    .filter((m) => m.raw !== 0n)
    .sort((a, b) => {
      const aa = a.raw < 0n ? -a.raw : a.raw;
      const bb = b.raw < 0n ? -b.raw : b.raw;
      return aa === bb ? 0 : aa > bb ? -1 : 1;
    });
}

/** Collapse repeated identical findings (e.g. per-instruction coverage notes). */
export function groupFindings(findings = []) {
  const groups = [];
  for (const f of findings) {
    const last = groups[groups.length - 1];
    if (
      last &&
      last.severity === f.severity &&
      last.title === f.title &&
      JSON.stringify(last.limitations) === JSON.stringify(f.limitations)
    ) {
      last.items.push(f);
    } else {
      groups.push({ ...f, items: [f] });
    }
  }
  return groups;
}

export function GlossaryTerm({ name }) {
  const [open, setOpen] = useState(false),
    [entry, setEntry] = useState(null);
  async function toggle() {
    setOpen(!open);
    if (!entry)
      try {
        setEntry(await api("/glossary/lookup", "POST", { term: name }));
      } catch (e) {
        setEntry({ status: "unavailable", reason: e.message });
      }
  }
  return (
    <span className="glossary-term">
      <button type="button" aria-expanded={open} onClick={toggle}>
        {name}
      </button>
      {open && (
        <span className="term-definition" role="status">
          {entry ? (
            <>
              {entry.definition || entry.reason}
              <small>{entry.label || entry.status}</small>
              {entry.sourceUrl && (
                <a href={entry.sourceUrl} target="_blank" rel="noreferrer">
                  Read source
                </a>
              )}
            </>
          ) : (
            "Looking up definition…"
          )}
        </span>
      )}
    </span>
  );
}

const VIDEO_STEPS = [
  { id: "narration", label: "Narration", dur: "2.2s" },
  { id: "rendering", label: "Rendering", dur: "5.2s" },
  { id: "encoding", label: "Encoding", dur: "2.1s" },
];

export function VideoSteps({ step }) {
  const R = 26,
    C = 2 * Math.PI * R;
  return (
    <div className="video-steps" aria-label="Video generation progress">
      {VIDEO_STEPS.map((s, i) => {
        const state =
          step === "done" || i < step
            ? "done"
            : i === step
              ? "active"
              : "pending";
        return (
          <div className="vstep-frag" key={s.id} style={{ display: "contents" }}>
            {i > 0 && (
              <div
                className={`vstep-connector ${i <= step || step === "done" ? "fill" : ""}`}
                aria-hidden="true"
              >
                <span />
              </div>
            )}
            <div className={`vstep vstep-${state}`}>
              <span className="vstep-dot">
                <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true">
                  <circle cx="32" cy="32" r={R} fill={state === "done" ? "#315ed8" : "none"} stroke="#dbe3f5" strokeWidth="6" />
                  {state === "active" && (
                    <circle
                      className="step-ring"
                      cx="32"
                      cy="32"
                      r={R}
                      fill="none"
                      stroke="#315ed8"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={C}
                      style={{ "--c": C, "--d": s.dur }}
                      transform="rotate(-90 32 32)"
                    />
                  )}
                </svg>
                <span className="vstep-mark">
                  {state === "done" ? <Check size={20} /> : i + 1}
                </span>
              </span>
              <span className="vstep-label">{s.label}</span>
              <span className="vstep-state">
                {state === "done" ? "Done" : state === "active" ? "Working…" : "Queued"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AccountControls({ onLoad }) {
  const { wallet, busy, error: authError, login, logout } = useWalletAuth();
  const [error, setError] = useState("");
  const [reports, setReports] = useState([]);
  useEffect(() => {
    setReports([]);
  }, [wallet]);
  async function recent() {
    try {
      setReports((await api("/reports")).reports);
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <div className="account-controls">
      <p>
        {wallet
          ? `Signed in: ${wallet.slice(0, 6)}…${wallet.slice(-6)}`
          : "Continue as a guest. Optional wallet sign-in saves reports across visits."}
      </p>
      <div className="workspace-actions">
        {wallet ? (
          <button
            className="button button-outline"
            disabled={busy}
            onClick={logout}
          >
            Sign out
          </button>
        ) : (
          <button
            className="button button-outline"
            disabled={busy}
            onClick={login}
          >
            {busy ? "Waiting for wallet…" : "Sign in with wallet"}
          </button>
        )}
        <button className="button button-outline" onClick={recent}>
          Recent reports
        </button>
      </div>
      {!wallet && (
        <small>
          Sign-in requests a login-message signature. It does not approve a
          transaction or token spending.
        </small>
      )}
      {(error || authError) && <p role="alert">{error || authError}</p>}
      {reports.map((r) => (
        <button
          key={r.id}
          className="recent-report"
          onClick={() => onLoad(r.id)}
        >
          {r.headline} · {new Date(r.createdAt).toLocaleString()}
        </button>
      ))}
    </div>
  );
}

export default function LiveReport({
  report,
  publicView = false,
  onNextPage,
  onLoad,
}) {
  const [showSpam, setShowSpam] = useState(false),
    [message, setMessage] = useState(""),
    [link, setLink] = useState(""),
    [video, setVideo] = useState(""),
    [busy, setBusy] = useState(false),
    [videoStep, setVideoStep] = useState(null),
    [copyHint, setCopyHint] = useState("Click the link to copy it.");
  const controller = useRef();
  const dialogRef = useRef();
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (link) {
      setCopyHint("Click the link to copy it.");
      if (!dialog.open) dialog.showModal();
    }
    if (!link && dialog.open) dialog.close();
  }, [link]);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const area = document.createElement("textarea");
      area.value = link;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopyHint("Copied to clipboard.");
  }
  async function action(kind) {
    setBusy(true);
    setMessage("");
    try {
      if (kind === "share") {
        if (report.demo) {
          setLink(demoShareUrl());
          return;
        }
        const result = await api(`/reports/${report.id}/share`, "POST", {
          publish: true,
        });
        setLink(new URL(result.url, location.origin).href);
      }
      if (kind === "save") {
        await api(`/reports/${report.id}/save`, "POST");
        setMessage("Report saved.");
      }
      if (kind === "video") {
        controller.current = new AbortController();
        setVideoStep(0);
        if (report.demo) {
          for (const [i, [stage, wait]] of [
            ["narration", 2200],
            ["rendering", 5200],
            ["encoding", 2100],
          ].entries()) {
            controller.current.signal.throwIfAborted();
            setVideoStep(i);
            setMessage(`Video: ${stage}`);
            await new Promise((resolve, reject) => {
              const timer = setTimeout(resolve, wait);
              controller.current.signal.addEventListener(
                "abort",
                () => {
                  clearTimeout(timer);
                  reject(new DOMException("Aborted", "AbortError"));
                },
                { once: true },
              );
            });
          }
          setVideo("/demo-explainer.mp4");
          setVideoStep("done");
          setMessage("Narrated video ready.");
          return;
        }
        const job = await api(`/reports/${report.id}/video`, "POST");
        const result = await waitForJob(
          job,
          (j) => {
            setMessage(`Video: ${j.stage}`);
            const i = ["narration", "rendering"].indexOf(j.stage);
            if (i >= 0) setVideoStep(i);
          },
          controller.current.signal,
        );
        setVideo(result.url);
        setVideoStep("done");
        setMessage("Narrated video ready.");
      }
    } catch (e) {
      if (e.name !== "AbortError") setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="workspace-result live-report"
      aria-label="Live analysis report"
    >
      <span className="paper-eyebrow">
        {report.demo
          ? "SCRIPTED CONCEPT PREVIEW · ILLUSTRATIVE DATA"
          : publicView
            ? "SHARED SNAPSHOT"
            : "LIVE REPORT"}{" "}
        · {new Date(report.createdAt).toLocaleString()}
      </span>
      <h3>{report.explanation?.headline || "Wallet activity"}</h3>
      {report.kind === "wallet" ? (
        <>
          <p>{report.history.coverage}</p>
          <label className="spam-toggle">
            <input
              type="checkbox"
              checked={showSpam}
              onChange={(e) => setShowSpam(e.target.checked)}
            />{" "}
            Show likely spam (
            {report.history.items.filter((i) => i.likelySpam).length})
          </label>
          <div className="history-list">
            {report.history.items
              .filter((i) => showSpam || !i.likelySpam)
              .map((i) => (
                <div key={i.signature}>
                  <span>
                    {i.signature}
                    <small>
                      {i.status}
                      {i.likelySpam ? ` · ${i.spamReason}` : ""}
                    </small>
                    {i.changes?.map((c, j) => (
                      <small key={j}>
                        {c.amount} {c.symbol || c.mint}
                      </small>
                    ))}
                  </span>
                  <button
                    onClick={() =>
                      onLoad?.(null, i.signature, report.history.cluster)
                    }
                  >
                    Explain
                  </button>
                </div>
              ))}
          </div>
          {!report.history.items.length && (
            <p>No transactions returned by this provider.</p>
          )}
          {report.history.nextCursor && (
            <button
              className="button button-outline"
              onClick={() => onNextPage?.(report.history)}
            >
              Next page
            </button>
          )}
        </>
      ) : (
        <>
          <p>
            Cluster: {report.facts.cluster} · Status: {report.facts.status} ·
            Fee:{" "}
            {report.facts.feeLamports !== undefined ? (
              <>
                {formatRaw(report.facts.feeLamports, 9)} SOL (
                {report.facts.feeLamports} lamports) paid by{" "}
                {shortAddr(report.facts.feePayer)}
              </>
            ) : (
              <>
                estimate unavailable before execution · Fee payer{" "}
                {shortAddr(report.facts.feePayer)}
              </>
            )}{" "}
            · Decoded {report.facts.coverage.supported}/
            {report.facts.coverage.total} instructions.
          </p>
          <details className="workspace-details" open>
            <summary>
              What moved (net per wallet,{" "}
              {netMovements(report.facts.assetChanges).length} lines)
            </summary>
            <p>
              <small>
                Net balance changes per owner. Do not add these to the
                instruction steps below — that would double-count the same
                money.
              </small>
            </p>
            <ul>
              {netMovements(report.facts.assetChanges).map((m, i) => (
                <li key={i}>
                  {shortAddr(m.owner)} {m.raw < 0n ? "sent" : "received"}{" "}
                  <strong>
                    {formatRaw(m.raw < 0n ? -m.raw : m.raw, m.decimals)}{" "}
                    {m.symbol || shortAddr(m.mint)}
                  </strong>{" "}
                  <small>({m.raw.toString()} base units)</small>
                </li>
              ))}
            </ul>
          </details>
          <p>
            Learn: <GlossaryTerm name="instruction" /> ·{" "}
            <GlossaryTerm name="lamport" /> · <GlossaryTerm name="delegate" /> ·{" "}
            <GlossaryTerm name="simulation" />
          </p>
          <ol className="live-steps">
            {report.explanation.steps.map((s) => (
              <li key={s.index}>{s.text}</li>
            ))}
          </ol>
          {groupFindings(report.findings).map((f, i) => (
            <div className="review-finding" key={i}>
              <div>
                <strong>
                  {f.severity.toUpperCase()} · {f.title}
                  {f.items.length > 1 ? ` (×${f.items.length})` : ""}
                </strong>
                {f.items.length > 1 ? (
                  <details>
                    <summary>
                      {f.items.length} similar notes — expand for each
                      instruction
                    </summary>
                    {f.items.map((item, j) => (
                      <p key={j}>{item.explanation}</p>
                    ))}
                  </details>
                ) : (
                  <p>{f.explanation}</p>
                )}
                {f.limitations.map((l, j) => (
                  <small key={j}>{l}</small>
                ))}
              </div>
            </div>
          ))}
          {report.simulation && (
            <details className="workspace-details">
              <summary>Simulation: {report.simulation.status}</summary>
              <p>{report.simulation.limitations.join(" ")}</p>
              <pre>{JSON.stringify(report.simulation, null, 2)}</pre>
            </details>
          )}
          {report.failure && (
            <div className="review-finding">
              <div>
                <strong>Why it failed</strong>
                <p>{report.failure.explanation}</p>
                <p>{report.failure.limitation}</p>
              </div>
            </div>
          )}
          <details className="workspace-details">
            <summary>Exact net balance changes</summary>
            <pre>{JSON.stringify(report.facts.assetChanges, null, 2)}</pre>
          </details>
          <details className="workspace-details">
            <summary>
              Trade comparison: {report.trade?.status || "not applicable"}
            </summary>
            <p>{report.trade?.reason}</p>
            {report.trade?.status === "estimated" && (
              <>
                <p>
                  Estimated USD value difference:{" "}
                  {report.trade.estimatedValueDifferencePercent.toFixed(2)}%
                </p>
                <p>{report.trade.limitations.join(" ")}</p>
                <pre>{JSON.stringify(report.trade.samples, null, 2)}</pre>
              </>
            )}
          </details>
          <details className="workspace-details" open>
            <summary>TinyFish source evidence</summary>
            <p>{report.researchCoverage}</p>
            {!report.research.length && (
              <p>
                No non-routine program or mint identifiers selected for web
                research.
              </p>
            )}
            {report.research.map((r, i) => (
              <div key={i}>
                <p>
                  {r.identifier} · {r.status}
                  {r.reason ? ` (${r.reason})` : ""}
                </p>
                {r.evidence.map((e) => (
                  <blockquote key={e.id}>
                    <a href={e.url} target="_blank" rel="noreferrer">
                      {e.title}
                    </a>
                    <p>{e.excerpt}</p>
                    <small>
                      {e.matchStatus} · {e.claim} · Retrieved {e.retrievedAt}
                    </small>
                  </blockquote>
                ))}
              </div>
            ))}
          </details>
          <details className="workspace-details">
            <summary>Decoded facts and logs</summary>
            <pre>{JSON.stringify(report.facts, null, 2)}</pre>
          </details>
          <p className="sample-limit">
            {report.explanation.limitations.join(" ")}
          </p>
          {!publicView && (
            <>
              <p>
                Publishing a link exposes this transaction’s addresses, amounts,
                findings, and sources to anyone with the link.
              </p>
              <div className="workspace-actions">
                <button
                  disabled={busy}
                  className="button button-outline"
                  onClick={() => action("save")}
                >
                  Save to account
                </button>
                {report.kind === "transaction" && (
                  <>
                    <button
                      disabled={busy}
                      className="button button-outline"
                      onClick={() => action("share")}
                    >
                      Publish share link
                    </button>
                    <button
                      disabled={busy}
                      className="button button-blue"
                      onClick={() => action("video")}
                    >
                      Generate narrated MP4
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </>
      )}
      {message && <p role="status">{message}</p>}
      {videoStep !== null && <VideoSteps step={videoStep} />}
      <dialog
        ref={dialogRef}
        className="preview-dialog"
        aria-labelledby="share-dialog-title"
        onClose={() => setLink("")}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
      >
        <div className="dialog-content">
          <button
            type="button"
            className="dialog-close"
            aria-label="Close share dialog"
            onClick={() => dialogRef.current?.close()}
          >
            ✕
          </button>
          <h2 id="share-dialog-title">Share link ready</h2>
          <p>Anyone with this link can view this report.</p>
          <button
            type="button"
            className="button button-blue"
            autoFocus
            style={{ overflowWrap: "anywhere", textAlign: "left" }}
            onClick={copyLink}
          >
            {link}
          </button>
          <p className="dialog-footnote">{copyHint}</p>
        </div>
      </dialog>
      {video && (
        <>
          <video
            controls
            style={{ width: "100%", margin: "20px 0" }}
            src={video.replace("/download", "/play")}
          />
          <a className="button button-outline" href={video} download>
            Download MP4
          </a>
        </>
      )}
    </section>
  );
}

export function SharedReport({ id }) {
  const [report, setReport] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (isDemoMode() && id === DEMO_SHARE_ID) {
      setReport(buildDemoReport());
      return;
    }
    const controller = new AbortController();
    fetch(`/api/shares/${id}`, { signal: controller.signal })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok)
          throw new Error(body?.error?.message || "Share link is invalid.");
        setReport(body);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [id]);
  return (
    <>
      <header className="site-header">
        <div className="container nav-wrap">
          <Brand href="/" />
          <div className="nav-actions">
            <span className="sample-pill">SHARED SNAPSHOT</span>
            <a href="/" className="nav-cta">
              Open workspace <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </header>
      <main className="container share-page">
        {error ? (
          <p role="alert">{error}</p>
        ) : report ? (
          <LiveReport report={report} publicView />
        ) : (
          <p>Loading shared report…</p>
        )}
      </main>
    </>
  );
}
