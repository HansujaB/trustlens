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
        EVIDENCE, NOT ASSUMPTIONS.
      </span>
      <div className="report-back-sheet">
        <span>THE DETAILS MAKE THE DIFFERENCE.</span>
      </div>
      <article className="report-paper">
        <div className="paper-top">
          <span>
            <span className="tiny-square" /> TRUSTLENS / FIELD REPORT
          </span>
          <span>№ 001</span>
        </div>
        <div className="paper-project">
          <div className="project-monogram">
            a<span>↗</span>
          </div>
          <div>
            <h2>Atlas Protocol</h2>
            <p>
              BASE NETWORK <span>·</span> ILLUSTRATIVE EXAMPLE
            </p>
          </div>
        </div>
        <div className="paper-summary">
          <span className="paper-eyebrow">THE FINDING</span>
          <h3>
            An audit exists.
            <br />
            Does it cover <em>this contract?</em>
          </h3>
          <p>
            The linked report covers an earlier implementation. Current coverage
            is unverified.
          </p>
        </div>
        <div className="paper-checks">
          <div>
            <span>
              <FileText size={14} />
              Audit publication
            </span>
            <Status type="supported">Found</Status>
          </div>
          <div>
            <span>
              <ScanLine size={14} />
              Current coverage
            </span>
            <Status type="unknown">Unverified</Status>
          </div>
          <div>
            <span>
              <Link2 size={14} />
              Source trail
            </span>
            <span className="source-count">3 references ↗</span>
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
          A claim is a starting point.
          <br />
          <em>Not a conclusion.</em>
        </span>
      </div>
      <div className="evidence-stamp">
        <Check size={15} />
        <span>
          SOURCES
          <br />
          <strong>ATTACHED</strong>
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
            <span className="live-dot" /> A CLEARER LOOK AT WEB3
          </div>
          <h1 id="hero-title">
            Trust is a claim.
            <br />
            Proof is a <em>click.</em>
          </h1>
          <p className="hero-description">
            Look beyond the promises. Explore a project’s audit claims, contract
            controls, and recent news—with the evidence in plain sight.
          </p>
          <div className="hero-actions">
            <a className="button button-blue" href="#investigate">
              Check a project{" "}
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
              <LockKeyhole size={13} /> No wallet connection
            </span>
            <span>
              <Link2 size={13} /> Every finding has a source
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
            ONE PROJECT. THREE PERSPECTIVES.
          </span>
          <span>
            <span className="scope-dot" />
            The claims
          </span>
          <span>
            <span className="scope-dot" />
            The contract
          </span>
          <span>
            <span className="scope-dot" />
            The conversation
          </span>
          <span className="scope-plus">+</span>
        </div>
      </div>
    </>
  );
}
