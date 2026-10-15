import { Plus, Minus } from "lucide-react";
import { SectionLabel } from "./ui";

const faqs = [
  [
    "Does TrustLens tell me if a project is safe?",
    "No. It is designed to show what the evidence supports, where claims conflict, and what remains unknown. A completed check is not a guarantee of safety, an investment recommendation, or a comprehensive security audit.",
  ],
  [
    "Do I need to connect my wallet?",
    "No. Checking public project information does not require wallet access, a seed phrase, or signing a transaction. This landing-page preview never connects to your wallet.",
  ],
  [
    "Does it find smart-contract vulnerabilities?",
    "The planned product performs selected contract checks and explains supported controls, such as recognized upgrade patterns. It does not provide comprehensive vulnerability detection or formal verification. Unsupported analysis is marked as unverified.",
  ],
  [
    "What does TinyFish do?",
    "TinyFish is the planned web research layer: it helps discover and navigate project documentation, audit publications, and recent developments. Separate blockchain reads inspect contract facts. This UI preview does not make paid TinyFish calls.",
  ],
  [
    "How are news and community sentiment handled?",
    "News and public discussion are kept separate from contract findings. Reports should show dates and sources, group repeated stories, and distinguish corroborated events from allegations. Positive sentiment is never treated as proof of safety.",
  ],
  [
    "Can I investigate a real project here?",
    "This is an interactive landing-page preview. You can explore the fictional Atlas Protocol report and the planned input flow. Live research, billing, and saved user reports are not connected yet.",
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
