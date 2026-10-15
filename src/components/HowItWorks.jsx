import {
  ArrowUpRight,
  Check,
  Link2,
  MousePointer2,
  Search,
} from "lucide-react";
import { SectionLabel } from "./ui";

export default function HowItWorks() {
  return (
    <section className="section container" id="how-it-works">
      <SectionLabel number="01">A LITTLE DUE DILIGENCE</SectionLabel>
      <div className="section-heading">
        <h2>
          You don’t need to read code.
          <br />
          You need <em>the full picture.</em>
        </h2>
        <p>
          Crypto moves fast. Take a moment to see what’s behind the project
          before you take the next step.
        </p>
      </div>
      <div className="steps-grid">
        <article className="step">
          <div className="step-art input-art">
            <div className="mini-input">
              <Link2 size={15} />
              <span>atlas.example</span>
              <span className="mini-submit">
                <ArrowUpRight size={16} />
              </span>
            </div>
            <MousePointer2
              className="mini-pointer"
              size={24}
              fill="var(--blue)"
            />
          </div>
          <div className="step-number">01 / START WITH A LINK</div>
          <h3>Bring your curiosity.</h3>
          <p>
            Start with a project website or contract address. See exactly which
            project and contract the report is about.
          </p>
        </article>
        <article className="step">
          <div className="step-art research-art">
            <span className="research-orbit orbit-one" />
            <span className="research-orbit orbit-two" />
            <div className="research-core">
              <Search size={25} />
            </div>
            <span className="orbit-tag tag-a">AUDIT.PDF</span>
            <span className="orbit-tag tag-b">CONTRACT</span>
            <span className="orbit-tag tag-c">NEWS</span>
          </div>
          <div className="step-number">02 / FOLLOW THE TRAIL</div>
          <h3>Look beneath the surface.</h3>
          <p>
            Trace published claims through audit reports, selected contract
            facts, and recent security developments.
          </p>
        </article>
        <article className="step">
          <div className="step-art summary-art">
            <div className="mini-sheet">
              <div>
                <Check size={12} />
                <span>Publication found</span>
              </div>
              <div>
                <span className="mini-unknown">?</span>
                <span>Coverage unverified</span>
              </div>
              <div className="mini-sheet-footer">
                OPEN THE EVIDENCE <ArrowUpRight size={11} />
              </div>
            </div>
          </div>
          <div className="step-number">03 / MAKE SENSE OF IT</div>
          <h3>Leave with clarity.</h3>
          <p>
            Understand what is supported, what conflicts, and what couldn’t be
            established. Follow any finding to its source.
          </p>
        </article>
      </div>
    </section>
  );
}
