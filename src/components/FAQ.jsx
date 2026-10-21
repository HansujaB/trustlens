import { Plus, Minus } from "lucide-react";
import { SectionLabel } from "./ui";

const faqs = [
  [
    "Does a successful simulation mean it is safe?",
    "No. Simulation previews execution against a particular chain state. It does not establish intent or guarantee later effects. TrustLens will explain specific findings and uncertainties rather than certify safety.",
  ],
  [
    "Do I need to connect my wallet?",
    "Not to explain a public signature or inspect a public address. Pre-signature review requires a serialized transaction from a compatible app; connecting a wallet alone cannot intercept another app’s pending transactions. This preview never connects to a wallet.",
  ],
  [
    "Which transactions will TrustLens understand?",
    "The first release targets SOL and supported SPL Token transfers, fees, approvals, and account changes. Swap adapters come next. Unknown programs and unsupported extensions remain visible instead of being guessed.",
  ],
  [
    "What does TinyFish do?",
    "Search discovers sources; Fetch retrieves evidence about exact token mints, programs, and reported incidents. Web Agent is reserved for selected multi-step investigations. RPC and parsers establish transaction facts. This preview makes no TinyFish calls.",
  ],
  [
    "Are amounts exact, and has accuracy been tested?",
    "The plan preserves integer base units and exposes exact amounts. Market values and simulation outputs have their own uncertainty. No mainnet benchmark has been completed for this frontend preview.",
  ],
  [
    "Can I analyze, share, or download a video now?",
    "Local input-format checks, illustrative reports, selectable definitions, a step-through explanation, and sample spam filtering work now. Live analysis, simulation, wallet pagination, direct report links, narrated videos, and MP4 downloads require the planned backend integrations.",
  ],
];

export default function FAQ() {
  return (
    <section className="section container faq-section" id="faq">
      <div>
        <SectionLabel number="05">GOOD QUESTIONS</SectionLabel>
        <h2>
          Clarity starts
          <br />
          with <em>a question.</em>
        </h2>
        <p>
          A few things worth knowing
          <br />
          before you look closer.
        </p>
      </div>
      <div className="faq-list">
        {faqs.map(([question, answer], index) => (
          <details key={question} className="faq-item">
            <summary>
              <span className="faq-number">0{index + 1}</span>
              <span>{question}</span>
              <Plus className="faq-plus" size={18} />
              <Minus className="faq-minus" size={18} />
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
