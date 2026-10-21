import { Plus, Minus } from "lucide-react";
import { SectionLabel } from "./ui";

const faqs = [
  [
    "Does a successful simulation mean it is safe?",
    "No. Simulation previews execution against a particular chain state. It does not establish intent or guarantee later effects. TrustLens will explain specific findings and uncertainties rather than certify safety.",
  ],
  [
    "Do I need to connect my wallet?",
    "Guest analysis needs no wallet. Optional sign-in uses a login-message signature to save reports. Pre-signature review requires a serialized transaction from a compatible app; wallet connection alone cannot intercept another app’s pending transactions.",
  ],
  [
    "Which transactions will TrustLens understand?",
    "The first release targets SOL and supported SPL Token transfers, fees, approvals, and account changes. Swap adapters come next. Unknown programs and unsupported extensions remain visible instead of being guessed.",
  ],
  [
    "What does TinyFish do?",
    "Search discovers sources; Fetch retrieves evidence about exact token mints and programs and supplies official sources for new glossary entries. Optional Web Agent supports scoped investigations. These features require configured TinyFish credentials; transaction facts come from RPC and decoding.",
  ],
  [
    "Are amounts exact, and has accuracy been tested?",
    "The backend preserves integer base units and exposes exact amounts. Historical USD comparisons are estimates. Automated fixture and API tests cover supported behavior; a broad mainnet accuracy benchmark has not been completed.",
  ],
  [
    "Can I analyze, share, or download a video now?",
    "With the API running, you can analyze transactions, simulate unsigned payloads, browse wallet pages, and publish share links. Narrated MP4s require enabled rendering and TTS credentials. Missing providers are reported explicitly; samples remain separately labeled.",
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
