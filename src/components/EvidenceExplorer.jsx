import { useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  Globe2,
  Plus,
  X,
} from "lucide-react";
import { SectionLabel, Status } from "./ui";

const examples = [
  {
    id: "facts",
    index: "01",
    name: "What actually moved",
    subtitle: "Transfers and fees are different.",
    claim: "“Why did my balance drop by more than 0.5 SOL?”",
    result: "0.5 SOL sent. A separate fee paid.",
    detail:
      "In this fictional transfer, 500,000,000 lamports go to the recipient and 5,000 lamports pay the network fee. The sender’s balance decreases by exactly 0.500005 SOL. No other account changes occur in this fixture.",
    type: "supported",
    status: "Illustrative chain facts",
    sources: [
      "System Program · decoded transfer",
      "Transaction metadata · 5,000-lamport fee",
      "Pre/post balances · sender and recipient",
    ],
    impact:
      "Exact base units belong in the report. A market value is a separate estimate.",
  },
  {
    id: "permission",
    index: "02",
    name: "The requested permissions",
    subtitle: "An approval deserves an explanation.",
    claim: "“I only meant to swap a token.”",
    result: "A delegate allowance needs review.",
    detail:
      "This fictional payload also authorizes a delegate to spend 100 tokens from a token account. Whether that permission is intended needs review. No real simulation has run in this preview.",
    type: "unknown",
    status: "Review required",
    sources: [
      "SPL Token · approval instruction",
      "Decoded delegate and allowance",
      "User intent · permission not established",
    ],
    impact:
      "A permission can be legitimate. Explain its scope instead of treating every approval as a scam.",
  },
  {
    id: "identity",
    index: "03",
    name: "The web investigation",
    subtitle: "A familiar name is not an identity.",
    claim: "“Is this the token from the official website?”",
    result: "The exact mint is not established.",
    detail:
      "This example shows how a future report handles uncertainty: a matching token name alone cannot link a website to the mint in the transaction. TinyFish evidence must include the exact identifier or leave identity unverified.",
    type: "unknown",
    status: "Identity unverified",
    sources: [
      "Transaction · output mint identifier",
      "Project documentation · candidate source",
      "Exact mint match · not established",
    ],
    impact:
      "Search → Fetch → correlate exact identifiers. Missing web evidence is not proof of malicious behavior.",
  },
];

export default function EvidenceExplorer() {
  const [active, setActive] = useState(0);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const tabRefs = useRef([]);
  const item = examples[active];

  function handleTabKey(event, index) {
    let next = index;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      next = (index + 1) % examples.length;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      next = (index - 1 + examples.length) % examples.length;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = examples.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    setActive(next);
    setSourcesOpen(false);
    tabRefs.current[next]?.focus();
  }
  return (
    <section className="evidence-section" id="evidence">
      <div className="container">
        <SectionLabel number="02" light>
          SHOW YOUR WORK
        </SectionLabel>
        <div className="section-heading">
          <h2>
            Don’t take our word.
            <br />
            <em>Take a closer look.</em>
          </h2>
          <p>
            A conclusion is only as useful as the evidence behind it. Here’s
            what a transaction report could show.
          </p>
        </div>
        <div className="evidence-layout">
          <div
            className="evidence-tabs"
            role="tablist"
            aria-orientation="vertical"
            aria-label="Sample report perspectives"
          >
            {examples.map((example, index) => (
              <button
                key={example.id}
                role="tab"
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                tabIndex={active === index ? 0 : -1}
                onKeyDown={(event) => handleTabKey(event, index)}
                id={`tab-${example.id}`}
                aria-selected={active === index}
                aria-controls="evidence-panel"
                className={`evidence-tab ${active === index ? "active" : ""}`}
                onClick={() => {
                  setActive(index);
                  setSourcesOpen(false);
                }}
              >
                <span className="tab-number">{example.index}</span>
                <span>
                  <strong>{example.name}</strong>
                  <small>{example.subtitle}</small>
                </span>
                <ArrowUpRight size={19} />
              </button>
            ))}
            <div className="example-disclaimer">
              <Globe2 size={16} />
              <p>
                Fictional transactions. Real questions.
                <br />
                These examples show the format, not a live investigation.
              </p>
            </div>
          </div>
          <article
            id="evidence-panel"
            role="tabpanel"
            tabIndex={0}
            aria-labelledby={`tab-${item.id}`}
            className="evidence-panel"
            key={item.id}
          >
            <div className="panel-header">
              <span>SOLANA / SAMPLE REPORT</span>
              <span className="sample-pill">ILLUSTRATIVE</span>
            </div>
            <div className="claim-block">
              <span className="paper-eyebrow">THE QUESTION</span>
              <blockquote>{item.claim}</blockquote>
            </div>
            <div className="evidence-connector">
              <ArrowDownRight size={20} />
              <span>WHAT THE EVIDENCE SHOWS</span>
            </div>
            <div className="finding-block">
              <Status type={item.type}>{item.status}</Status>
              <h3>{item.result}</h3>
              <p>{item.detail}</p>
            </div>
            <button
              className="source-toggle"
              aria-expanded={sourcesOpen}
              aria-controls="sample-sources"
              onClick={() => setSourcesOpen(!sourcesOpen)}
            >
              <span>
                <FileText size={15} />
                {sourcesOpen
                  ? "Hide source trail"
                  : "Explore the source trail"}{" "}
                <small>03</small>
              </span>
              {sourcesOpen ? <X size={16} /> : <Plus size={16} />}
            </button>
            {sourcesOpen && (
              <div className="sample-sources" id="sample-sources">
                {item.sources.map((source, index) => (
                  <div key={source}>
                    <span>0{index + 1}</span>
                    {source}
                    <small>DEMO REFERENCE</small>
                  </div>
                ))}
                <p>
                  Live reports would link to retrieved sources. These references
                  illustrate the evidence structure.
                </p>
              </div>
            )}
            <div className="panel-footnote">{item.impact}</div>
          </article>
        </div>
      </div>
    </section>
  );
}
