import {
  ArrowUpRight,
  Braces,
  FileSearch,
  Fingerprint,
  Waves,
} from "lucide-react";
import { SectionLabel } from "./ui";

export default function Principles() {
  return (
    <section className="section container principles-section">
      <div className="principles-copy">
        <SectionLabel number="03">BUILT AROUND EVIDENCE</SectionLabel>
        <h2>
          Less black box.
          <br />
          <em>More open book.</em>
        </h2>
        <p>
          A polished website isn’t proof. Neither is a confident AI answer.
          TrustLens is designed to keep the facts—and their limits—visible.
        </p>
        <a className="text-link" href="#faq">
          Understand the limits <ArrowUpRight size={17} />
        </a>
      </div>
      <div className="principles-list">
        <article>
          <span className="principle-icon">
            <FileSearch size={23} />
          </span>
          <div>
            <h3>The web, with a paper trail.</h3>
            <p>
              TinyFish-powered research follows documentation, audit
              publications, and recent developments.
            </p>
            <span className="technology-note">
              <Waves size={13} /> WEB RESEARCH WITH TINYFISH
            </span>
          </div>
        </article>
        <article>
          <span className="principle-icon">
            <Braces size={23} />
          </span>
          <div>
            <h3>The contract, in context.</h3>
            <p>
              Selected on-chain checks help explain the deployment and its
              controls. This is limited screening, not a security audit.
            </p>
          </div>
        </article>
        <article>
          <span className="principle-icon">
            <Fingerprint size={23} />
          </span>
          <div>
            <h3>The unknowns, out in the open.</h3>
            <p>
              No mystery trust score. No “safe” stamp. Just supported findings,
              contradictions, and clearly marked gaps.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
