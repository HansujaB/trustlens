import { useEffect, useRef, useState } from "react";
import bs58 from "bs58";
import { api, getSession, waitForJob } from "../lib/api";

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

export function AccountControls({ onLoad }) {
  const [wallet, setWallet] = useState(null),
    [error, setError] = useState(""),
    [reports, setReports] = useState([]),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    getSession()
      .then((s) => setWallet(s.wallet))
      .catch(() => {});
  }, []);
  async function login() {
    setBusy(true);
    setError("");
    try {
      const provider = window.phantom?.solana || window.solana;
      if (!provider?.connect || !provider?.signMessage)
        throw new Error(
          "Install a compatible Solana wallet with message-signing support. Guest analysis needs no wallet.",
        );
      const connected = await provider.connect();
      const address = connected.publicKey.toString();
      const challenge = await api("/auth/challenge", "POST", { address });
      const signed = await provider.signMessage(
        new TextEncoder().encode(challenge.message),
        "utf8",
      );
      const session = await api("/auth/verify", "POST", {
        signature: bs58.encode(signed.signature),
      });
      setWallet(session.wallet);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
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
            onClick={async () => {
              try {
                await api("/auth/logout", "POST");
                setWallet(null);
                setReports([]);
              } catch (e) {
                setError(e.message);
              }
            }}
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
      {error && <p role="alert">{error}</p>}
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
    [busy, setBusy] = useState(false);
  const controller = useRef();
  useEffect(() => () => controller.current?.abort(), []);
  async function action(kind) {
    setBusy(true);
    setMessage("");
    try {
      if (kind === "share") {
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
        const job = await api(`/reports/${report.id}/video`, "POST");
        const result = await waitForJob(
          job,
          (j) => setMessage(`Video: ${j.stage}`),
          controller.current.signal,
        );
        setVideo(result.url);
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
        {publicView ? "SHARED SNAPSHOT" : "LIVE REPORT"} ·{" "}
        {new Date(report.createdAt).toLocaleString()}
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
            Decoded {report.facts.coverage.supported}/
            {report.facts.coverage.total} instructions.
          </p>
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
          {report.findings.map((f, i) => (
            <div className="review-finding" key={i}>
              <div>
                <strong>
                  {f.severity.toUpperCase()} · {f.title}
                </strong>
                <p>{f.explanation}</p>
                {f.limitations.map((l, j) => (
                  <small key={j}>{l}</small>
                ))}
              </div>
            </div>
          ))}
          {report.simulation && (
            <details className="workspace-details" open>
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
      {link && (
        <p>
          <a href={link}>{link}</a>
        </p>
      )}
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
    fetch(`/api/shares/${id}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error.message);
        setReport(body);
      })
      .catch((e) => setError(e.message));
  }, [id]);
  return (
    <main className="container">
      <a href="/">TrustLens home</a>
      {error ? (
        <p role="alert">{error}</p>
      ) : report ? (
        <LiveReport report={report} publicView />
      ) : (
        <p>Loading shared report…</p>
      )}
    </main>
  );
}
