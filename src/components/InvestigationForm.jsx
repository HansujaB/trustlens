import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  CircleHelp,
  FileSearch,
  LockKeyhole,
  Play,
  ShieldCheck,
  Wallet,
  Waves,
} from "lucide-react";
import { validateInput } from "../lib/inputValidation";
import LiveReport, { AccountControls } from "./LiveReport";
import { api, waitForJob } from "../lib/api";

const modes = [
  {
    id: "transaction",
    name: "Explain a transaction",
    icon: FileSearch,
    label: "Solana transaction signature",
    placeholder: "Paste a base58 transaction signature",
    hint: "A transaction signature identifies an executed transaction. It is not a wallet address.",
  },
  {
    id: "presign",
    name: "Check before signing",
    icon: ShieldCheck,
    label: "Unsigned transaction · base64",
    placeholder: "Paste a serialized unsigned transaction",
    hint: "Connecting a wallet cannot reveal a pending transaction. Supply the payload from a compatible app. Never paste a recovery phrase or private key.",
  },
  {
    id: "wallet",
    name: "Explore a wallet",
    icon: Wallet,
    label: "Public Solana wallet address",
    placeholder: "Paste a public wallet address",
    hint: "Only public addresses. No wallet connection or signatures needed.",
  },
];
const definitions = {
  lamports:
    "A lamport is one billionth of a SOL. Integer base units preserve exact amounts.",
  delegate:
    "A delegate is an account granted a specific token-spending allowance.",
  simulation:
    "A simulation previews a transaction against a particular chain state without broadcasting it. Later execution can differ.",
};
function Term({ name }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="glossary-term">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        {name}
      </button>
      {open && (
        <span className="term-definition" role="status">
          {definitions[name]}
        </span>
      )}
    </span>
  );
}

function SampleReport({ mode }) {
  const [revealSpam, setRevealSpam] = useState(false);
  const [step, setStep] = useState(0);
  const steps = [
    "The sender requests a 0.5 SOL transfer.",
    "The System Program transfers 500,000,000 lamports to the recipient.",
    "A separate 5,000-lamport fee makes the sender’s total decrease 0.500005 SOL.",
  ];
  return (
    <section className="workspace-result" aria-labelledby="sample-title">
      <div className="workspace-result-header">
        <span className="paper-eyebrow">
          ILLUSTRATIVE FIXTURE · NOT YOUR INPUT
        </span>
        <span className="sample-pill">NO LIVE CALLS</span>
      </div>
      <h3 id="sample-title">
        {mode === "transaction"
          ? "0.5 SOL sent. Every step explained."
          : mode === "presign"
            ? "Review required: a delegate can spend tokens."
            : "Your activity, with room for the details."}
      </h3>
      <p className="result-intro">
        {mode === "transaction" ? (
          <>
            This fictional transfer separates the asset movement from the
            network fee, measured in <Term name="lamports" />.
          </>
        ) : mode === "presign" ? (
          <>
            This fictional payload grants a <Term name="delegate" /> an
            allowance of 100 tokens. Its purpose is not established; this is not
            proof of malicious behavior.
          </>
        ) : (
          "A fictional wallet history demonstrates transaction grouping and reversible spam filtering."
        )}
      </p>
      {mode === "wallet" ? (
        <>
          <label className="spam-toggle">
            <input
              type="checkbox"
              checked={revealSpam}
              onChange={(e) => setRevealSpam(e.target.checked)}
            />{" "}
            Show likely spam (1)
          </label>
          <div className="history-list">
            <div>
              <span>
                01 · SOL transfer
                <small>Illustrative successful transaction</small>
              </span>
              <strong>−0.5 SOL</strong>
            </div>
            <div>
              <span>
                02 · Token receipt<small>Illustrative incoming transfer</small>
              </span>
              <strong>+25 USDC</strong>
            </div>
            {revealSpam && (
              <div>
                <span>
                  03 · Unsolicited token
                  <small>
                    Heuristic: unsolicited deposit with a promotional memo. Not
                    proof of a scam.
                  </small>
                </span>
                <strong>Likely spam</strong>
              </div>
            )}
          </div>
          <p className="sample-limit">
            Sample history only. Live pagination will require the Solana RPC
            integration.
          </p>
        </>
      ) : (
        <>
          <div className="result-metrics">
            <div>
              <span>
                {mode === "transaction" ? "Sent" : "Delegate allowance"}
              </span>
              <strong>
                {mode === "transaction" ? "0.5 SOL" : "100 tokens"}
              </strong>
              <small>
                {mode === "transaction"
                  ? "Recipient receives 0.5 SOL"
                  : "Example token · 6 decimals"}
              </small>
            </div>
            <div>
              <span>
                {mode === "transaction" ? "Network fee" : "Simulation"}
              </span>
              <strong>
                {mode === "transaction" ? "0.000005 SOL" : "Not run"}
              </strong>
              <small>
                {mode === "transaction"
                  ? "5,000 lamports · fixture value"
                  : "Live RPC is not connected"}
              </small>
            </div>
            <div>
              <span>
                {mode === "transaction" ? "Sender change" : "Web identity"}
              </span>
              <strong>
                {mode === "transaction" ? "−0.500005 SOL" : "Unverified"}
              </strong>
              <small>
                {mode === "transaction"
                  ? "Transfer + fee"
                  : "No source retrieved in this demo"}
              </small>
            </div>
          </div>
          {mode === "transaction" ? (
            <div className="transaction-story">
              <div
                className="story-flow"
                aria-label="Sender to System Program to recipient"
              >
                <span>Your wallet</span>
                <ArrowRight size={16} />
                <span>System Program</span>
                <ArrowRight size={16} />
                <span>Recipient</span>
              </div>
              <div className="story-controls">
                <span className="paper-eyebrow">STEP {step + 1} / 3</span>
                <button onClick={() => setStep((step + 1) % steps.length)}>
                  <Play size={13} />{" "}
                  {step === 2 ? "Restart explanation" : "Next step"}
                </button>
              </div>
              <p aria-live="polite">{steps[step]}</p>
              <small>
                Step-through preview. Narration and MP4 export are planned.
              </small>
            </div>
          ) : (
            <div className="review-finding">
              <ShieldCheck size={22} />
              <div>
                <strong>Inspect the requested permission</strong>
                <p>
                  An approval allows spending from a specific token account, up
                  to the authorized amount. Check the delegate and whether that
                  permission matches your intent. A successful{" "}
                  <Term name="simulation" /> would not certify safety.
                </p>
              </div>
            </div>
          )}
        </>
      )}
      <div className="evidence-boundary">
        <Braces size={18} />
        <p>
          <strong>Transaction facts</strong> come from decoding and RPC.{" "}
          <strong>Web context</strong> comes from TinyFish sources. Neither this
          fixture nor a successful simulation certifies safety.
        </p>
      </div>
      <details className="workspace-details">
        <summary>
          <Waves size={16} /> TinyFish evidence · integration preview
        </summary>
        <p>
          Live reports will show exact mint/program matches, source excerpts,
          URLs, and retrieval times. This sample has no retrieved evidence.
          Missing sources do not imply a scam.
        </p>
        <a href="https://docs.tinyfish.ai/" target="_blank" rel="noreferrer">
          TinyFish documentation <ArrowUpRight size={13} />
        </a>
      </details>
      <details className="workspace-details">
        <summary>
          <CircleHelp size={16} /> What is available in this preview?
        </summary>
        <p>
          Input-format checks, sample reports, selectable definitions,
          step-through explanations, and reversible sample spam filtering work
          locally. Live RPC, simulation, research, historical prices, saved
          share links, narration, and MP4 export are planned integrations.
        </p>
      </details>
    </section>
  );
}

export default function InvestigationForm() {
  const [mode, setMode] = useState("transaction");
  const [value, setValue] = useState("");
  const [cluster, setCluster] = useState("mainnet-beta");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sample, setSample] = useState(false);
  const [report, setReport] = useState(null);
  const [job, setJob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [intentOwner, setIntentOwner] = useState("");
  const [maxLamports, setMaxLamports] = useState("");
  const controller = useRef();
  useEffect(() => () => controller.current?.abort(), []);
  const tabs = useRef([]);
  const current = modes.find((item) => item.id === mode);
  function choose(id) {
    if (busy) return;
    setMode(id);
    setValue("");
    setError("");
    setNotice("");
    setSample(false);
    setReport(null);
  }
  async function analyze(input) {
    setError("");
    setReport(null);
    setSample(false);
    setBusy(true);
    controller.current = new AbortController();
    try {
      const queued = await api(
        "/analyses",
        "POST",
        input,
        controller.current.signal,
      );
      setJob(queued);
      const result = await waitForJob(
        queued,
        (j) => setNotice(`Analysis: ${j.stage}`),
        controller.current.signal,
      );
      setReport(
        await api(
          `/reports/${result.reportId}`,
          "GET",
          undefined,
          controller.current.signal,
        ),
      );
      setNotice("Analysis complete.");
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message);
    } finally {
      setBusy(false);
      setJob(null);
    }
  }
  async function loadReport(id, signature, sourceCluster) {
    if (signature)
      return analyze({
        kind: "transaction",
        signature,
        cluster: sourceCluster,
      });
    try {
      setReport(await api(`/reports/${id}`));
      setSample(false);
    } catch (e) {
      setError(e.message);
    }
  }
  function submit(e) {
    e.preventDefault();
    const result = validateInput(mode, value);
    setError(result.error || "");
    setSample(false);
    if (result.error) return;
    analyze(
      mode === "transaction"
        ? { kind: mode, signature: value.trim(), cluster }
        : mode === "wallet"
          ? { kind: mode, address: value.trim(), cluster }
          : {
              kind: mode,
              payload: value.trim(),
              cluster,
              intent: {
                ...(intentOwner ? { owner: intentOwner.trim() } : {}),
                ...(maxLamports ? { maxSolLamports: maxLamports.trim() } : {}),
              },
            },
    );
  }
  return (
    <section
      className="workspace-section"
      id="investigate"
      aria-labelledby="workspace-title"
    >
      <div className="container">
        <div className="workspace-heading">
          <div>
            <div className="eyebrow">
              <span className="live-dot" /> THE TRUSTLENS WORKSPACE
            </div>
            <h2 id="workspace-title">
              Less decoding. <em>More understanding.</em>
            </h2>
          </div>
          <span className="preview-label">SOLANA ANALYSIS WORKSPACE</span>
        </div>
        <div className="workspace-shell">
          <div
            className="workspace-tabs"
            role="tablist"
            aria-label="Investigation mode"
          >
            {modes.map((item, index) => (
              <button
                key={item.id}
                ref={(el) => {
                  tabs.current[index] = el;
                }}
                type="button"
                disabled={busy}
                role="tab"
                id={`workspace-tab-${item.id}`}
                aria-selected={mode === item.id}
                aria-controls="workspace-input-panel"
                tabIndex={mode === item.id ? 0 : -1}
                onClick={() => choose(item.id)}
                onKeyDown={(e) => {
                  let next;
                  if (e.key === "ArrowRight") next = (index + 1) % modes.length;
                  if (e.key === "ArrowLeft")
                    next = (index + modes.length - 1) % modes.length;
                  if (e.key === "Home") next = 0;
                  if (e.key === "End") next = modes.length - 1;
                  if (next !== undefined) {
                    e.preventDefault();
                    choose(modes[next].id);
                    tabs.current[next]?.focus();
                  }
                }}
              >
                <item.icon size={17} />
                {item.name}
              </button>
            ))}
          </div>
          <div
            className="workspace-input"
            id="workspace-input-panel"
            role="tabpanel"
            aria-labelledby={`workspace-tab-${mode}`}
          >
            <AccountControls onLoad={loadReport} />
            <form onSubmit={submit} noValidate>
              <div className="workspace-field-heading">
                <label htmlFor="solana-input">{current.label}</label>
                <label className="cluster-label">
                  Cluster
                  <select
                    disabled={busy}
                    value={cluster}
                    onChange={(e) => {
                      setCluster(e.target.value);
                      setNotice("");
                    }}
                  >
                    <option value="mainnet-beta">Mainnet beta</option>
                    <option value="devnet">Devnet</option>
                  </select>
                </label>
              </div>
              <textarea
                disabled={busy}
                id="solana-input"
                rows={mode === "presign" ? 4 : 2}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError("");
                  setNotice("");
                  setSample(false);
                }}
                placeholder={current.placeholder}
                autoComplete="off"
                spellCheck="false"
                maxLength={20000}
                aria-invalid={Boolean(error)}
                aria-describedby={`workspace-hint${error ? " workspace-error" : ""}`}
              />
              <p id="workspace-hint" className="workspace-hint">
                {current.hint}
              </p>
              {mode === "presign" && (
                <label className="intent-label">
                  Optional intent check · direct SOL transfers only
                  <input
                    placeholder="Your public wallet address"
                    value={intentOwner}
                    onChange={(e) => setIntentOwner(e.target.value)}
                    maxLength={44}
                  />
                  <input
                    placeholder="Maximum transfer in lamports (1 SOL = 1000000000)"
                    value={maxLamports}
                    onChange={(e) => setMaxLamports(e.target.value)}
                    inputMode="numeric"
                    maxLength={20}
                  />
                </label>
              )}
              {error && (
                <p
                  id="workspace-error"
                  className="workspace-error"
                  role="alert"
                >
                  {error}
                </p>
              )}
              <div className="workspace-actions">
                <button
                  disabled={busy}
                  className="button button-blue"
                  type="submit"
                >
                  {busy ? "Analyzing…" : "Analyze with TrustLens"}{" "}
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="button button-outline"
                  onClick={() => {
                    setError("");
                    setNotice("");
                    setSample(true);
                  }}
                >
                  Explore{" "}
                  {mode === "presign"
                    ? "review"
                    : mode === "wallet"
                      ? "history"
                      : "transfer"}{" "}
                  sample <ArrowUpRight size={16} />
                </button>
                <span>
                  <LockKeyhole size={13} /> No transaction signing or
                  broadcasting.
                </span>
              </div>
              <p className="workspace-hint">
                Analysis sends the signature, public address, or unsigned
                payload to the backend and its RPC provider. TinyFish receives
                selected public identifiers. Reports start private to your
                session.
              </p>
              {notice && (
                <p className="workspace-notice" role="status">
                  {notice}
                </p>
              )}
              {job && (
                <button
                  type="button"
                  className="button button-outline"
                  onClick={async () => {
                    try {
                      await api(`/jobs/${job.id}`, "DELETE");
                      controller.current?.abort();
                      setNotice("Analysis cancelled.");
                    } catch (e) {
                      setError(e.message);
                    }
                  }}
                >
                  Cancel analysis
                </button>
              )}
            </form>
            {sample && <SampleReport key={mode} mode={mode} />}
            {report && !sample && (
              <LiveReport
                key={report.id}
                report={report}
                onLoad={loadReport}
                onNextPage={(h) =>
                  analyze({
                    kind: "wallet",
                    address: h.address,
                    cluster: h.cluster,
                    before: h.nextCursor,
                  })
                }
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
