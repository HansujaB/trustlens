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
          On-chain facts, simulation estimates, and external claims are
          different kinds of evidence. TrustLens keeps that distinction visible.
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
              TinyFish Search and Fetch investigate exact mints and program IDs
              when configured. Optional Web Agent supports scoped follow-up
              questions.
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
            <h3>The transaction, decoded.</h3>
            <p>
              Solana RPC establishes executed effects. Simulation previews
              proposed effects. Supported parsers explain instructions; unknown
              ones stay visible.
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
              No opaque safety score. Every warning needs a reason. An unknown
              program is not automatically malicious, and successful simulation
              is not proof of safety.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
