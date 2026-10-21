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
      <SectionLabel number="01">FROM DATA TO UNDERSTANDING</SectionLabel>
      <div className="section-heading">
        <h2>
          You don’t need to read code.
          <br />
          You need <em>the full picture.</em>
        </h2>
        <p>
          A signature, an unsigned payload, or a public address. Three ways to
          understand what happens on Solana.
        </p>
      </div>
      <div className="steps-grid">
        <article className="step">
          <div className="step-art input-art">
            <div className="mini-input">
              <Link2 size={15} />
              <span>Solana signature…</span>
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
          <div className="step-number">01 / BRING A TRANSACTION</div>
          <h3>Start with what you have.</h3>
          <p>
            Paste a transaction signature to explain the past, or an unsigned
            payload to review a proposed action.
          </p>
        </article>
        <article className="step">
          <div className="step-art research-art">
            <span className="research-orbit orbit-one" />
            <span className="research-orbit orbit-two" />
            <div className="research-core">
              <Search size={25} />
            </div>
            <span className="orbit-tag tag-a">RPC FACTS</span>
            <span className="orbit-tag tag-b">SIMULATION</span>
            <span className="orbit-tag tag-c">WEB CONTEXT</span>
          </div>
          <div className="step-number">02 / FOLLOW THE TRAIL</div>
          <h3>Look beneath the surface.</h3>
          <p>
            Decode supported instructions and simulate proposed actions.
            TinyFish investigates exact token mints and program IDs.
          </p>
        </article>
        <article className="step">
          <div className="step-art summary-art">
            <div className="mini-sheet">
              <div>
                <Check size={12} />
                <span>Transfer decoded</span>
              </div>
              <div>
                <span className="mini-unknown">?</span>
                <span>Identity unverified</span>
              </div>
              <div className="mini-sheet-footer">
                OPEN THE EVIDENCE <ArrowUpRight size={11} />
              </div>
            </div>
          </div>
          <div className="step-number">03 / MAKE SENSE OF IT</div>
          <h3>Leave with clarity.</h3>
          <p>
            Read a headline and step-by-step detail. Inspect sources,
            permissions, fees, and the parts that remain unknown.
          </p>
        </article>
      </div>
    </section>
  );
}
