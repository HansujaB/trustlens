import {
  ArrowDown,
  ArrowUpRight,
  Check,
  FileText,
  Link2,
  LockKeyhole,
  ScanLine,
} from "lucide-react";
import { Status } from "./ui";

function ReportPreview() {
  return (
    <div className="report-scene" aria-label="Illustrative TrustLens report">
      <div className="scene-axis axis-horizontal" />
      <div className="scene-axis axis-vertical" />
      <span className="scene-coordinate coordinate-top">
        ON-CHAIN FACTS. HUMAN CONTEXT.
      </span>
      <div className="report-back-sheet">
        <span>UNDERSTAND THE NEXT SIGNATURE.</span>
      </div>
      <article className="report-paper">
        <div className="paper-top">
          <span>
            <span className="tiny-square" /> TRUSTLENS / TRANSACTION REPORT
          </span>
          <span>№ 001</span>
        </div>
        <div className="paper-project">
          <div className="project-monogram">
            ◎<span>↗</span>
          </div>
          <div>
            <h2>Before you approve</h2>
            <p>
              SOLANA <span>·</span> ILLUSTRATIVE EXAMPLE
            </p>
          </div>
        </div>
        <div className="paper-summary">
          <span className="paper-eyebrow">THE FINDING</span>
          <h3>
            A swap looks simple.
            <br />
            What are you <em>authorizing?</em>
          </h3>
          <p>
            A proposed token swap includes a delegate approval. Understand the
            permission before making your decision.
          </p>
        </div>
        <div className="paper-checks">
          <div>
            <span>
              <FileText size={14} />
              Instruction decoded
            </span>
            <Status type="supported">Approval</Status>
          </div>
          <div>
            <span>
              <ScanLine size={14} />
              Token identity
            </span>
            <Status type="unknown">Unverified</Status>
          </div>
          <div>
            <span>
              <Link2 size={14} />
              Web investigation
            </span>
            <span className="source-count">TinyFish context ↗</span>
          </div>
        </div>
        <a className="paper-bottom" href="#evidence">
          <span>Follow the evidence</span>
          <ArrowUpRight size={17} />
        </a>
      </article>
      <div className="annotation-note">
        <span className="annotation-line" />
        <span>
          Simulation is a preview.
          <br />
          <em>Not a safety guarantee.</em>
        </span>
      </div>
      <div className="evidence-stamp">
        <Check size={15} />
        <span>
          READ
          <br />
          <strong>BEFORE SIGNING</strong>
        </span>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <>
      <section className="hero container" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" /> A CLEARER LOOK AT SOLANA
          </div>
          <h1 id="hero-title">
            Every signature
            <br />
            tells a <em>story.</em>
          </h1>
          <p className="hero-description">
            Understand what moved. See what you’re authorizing. Explore Solana
            transactions with plain-English explanations and web evidence from TinyFish.
          </p>
          <div className="hero-actions">
            <a className="button button-blue" href="#investigate">
              Explore TrustLens{" "}
              <span className="button-icon">
                <ArrowUpRight size={20} />
              </span>
            </a>
            <a href="#evidence" className="text-link">
              Explore a sample <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="hero-assurances">
            <span>
              <LockKeyhole size={13} /> No transaction signing or sending
            </span>
            <span>
              <Link2 size={13} /> Facts and context, separated
            </span>
          </div>
        </div>
        <ReportPreview />
        <div className="hero-bottom">
          <span>LESS GUESSWORK. MORE CONTEXT.</span>
          <a href="#how-it-works">
            SCROLL TO LOOK CLOSER <ArrowDown size={13} />
          </a>
        </div>
      </section>
      <div className="scope-strip">
        <div className="container scope-inner">
          <span className="scope-caption">
            ONE TRANSACTION. THE FULL PICTURE.
          </span>
          <span>
            <span className="scope-dot" />
            Explain what happened
          </span>
          <span>
            <span className="scope-dot" />
            Review before signing
          </span>
          <span>
            <span className="scope-dot" />
            Investigate the context
          </span>
          <span className="scope-plus">+</span>
        </div>
      </div>
    </>
  );
}
