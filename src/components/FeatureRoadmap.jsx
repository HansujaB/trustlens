import {
  ArrowUpRight,
  BookOpen,
  ChartNoAxesCombined,
  Film,
  Share2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { SectionLabel } from "./ui";
const features = [
  [
    BookOpen,
    "Transaction explanations",
    "A concise headline, step-by-step transfers, exact base units, and selectable plain-English definitions.",
    "IMPLEMENTED",
  ],
  [
    ShieldCheck,
    "Review before signing",
    "Decode an unsigned payload, simulate it, and inspect specific permission and outflow findings.",
    "IMPLEMENTED",
  ],
  [
    Wallet,
    "Wallet history",
    "Paginated public activity with automatic, reversible filtering for likely spam and visible coverage limits.",
    "RPC COVERAGE",
  ],
  [
    ChartNoAxesCombined,
    "Trade comparison",
    "Estimate historical USD differences for supported token pairs, with source timestamps and explicit uncertainty.",
    "PROVIDER REQUIRED",
  ],
  [
    Share2,
    "Shareable reports",
    "A direct, dated report link with facts, findings, source evidence, and a disclosure of what you share.",
    "IMPLEMENTED",
  ],
  [
    Film,
    "Narrated explainer videos",
    "An animated account of fund movements, narration, and MP4 download generated from the report’s facts.",
    "TTS REQUIRED",
  ],
];
export default function FeatureRoadmap() {
  return (
    <section className="capabilities-section" id="capabilities">
      <div className="container section">
        <SectionLabel number="04">THE PRODUCT, IN FOCUS</SectionLabel>
        <div className="section-heading">
          <h2>
            From a signature
            <br />
            to <em>the whole story.</em>
          </h2>
          <p>
            One report connects on-chain facts, source evidence, and
            plain-English explanations. Each integration shows its coverage and
            availability.
          </p>
        </div>
        <div className="capabilities-grid">
          {features.map(([Icon, title, text, stage]) => (
            <article key={title}>
              <div className="capability-top">
                <Icon size={23} />
                <span>{stage}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <a className="text-link capability-link" href="#investigate">
          Open the analysis workspace <ArrowUpRight size={16} />
        </a>
      </div>
    </section>
  );
}
