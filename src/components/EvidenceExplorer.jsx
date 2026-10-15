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
    id: "audit",
    index: "01",
    name: "The audit claim",
    subtitle: "A badge is only the beginning.",
    claim: "“Our current deployment is fully audited.”",
    result: "Current coverage is unverified.",
    detail:
      "The linked report names implementation A. The selected contract now points to implementation B. That report alone does not establish coverage of the current code.",
    type: "unknown",
    status: "Unverified",
    sources: [
      "Project security page",
      "Report scope · implementation A",
      "Chain observation · implementation B",
    ],
    impact:
      "An audit can be genuine and still leave today’s deployment unchecked.",
  },
  {
    id: "contract",
    index: "02",
    name: "The contract controls",
    subtitle: "Know who can change the rules.",
    claim: "“The contract cannot be changed.”",
    result: "An upgrade path is present.",
    detail:
      "In this fictional example, a supported contract check identifies an administrator-controlled upgrade path. That conflicts with the website’s claim of immutability.",
    type: "conflict",
    status: "Contradicted",
    sources: [
      "Project documentation",
      "Verified proxy source",
      "Upgrade authority observation",
    ],
    impact:
      "An upgrade control is a permission to understand—not, by itself, proof of a scam.",
  },
  {
    id: "news",
    index: "03",
    name: "The recent developments",
    subtitle: "Find the context behind the headlines.",
    claim: "“Users are reporting withdrawal delays.”",
    result: "Reports found. Cause unverified.",
    detail:
      "Sample public posts describe delays. The project has published a response, but those statements do not independently establish the cause or whether this contract is affected.",
    type: "unknown",
    status: "Reported concern",
    sources: [
      "Public discussion · sample posts",
      "Project response",
      "Affected contract · not established",
    ],
    impact:
      "A concern deserves context. Repeated posts do not turn an allegation into a fact.",
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
            what a report could show.
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
                Fictional project. Real questions.
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
              <span>ATLAS PROTOCOL / SAMPLE REPORT</span>
              <span className="sample-pill">ILLUSTRATIVE</span>
            </div>
            <div className="claim-block">
              <span className="paper-eyebrow">WHAT THE PROJECT SAYS</span>
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
