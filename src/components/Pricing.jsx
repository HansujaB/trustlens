import { ArrowUpRight, Check } from "lucide-react";
import { SectionLabel } from "./ui";

const plans = [
  {
    name: "First look",
    label: "FOR THE CURIOUS",
    price: "0",
    suffix: "to explore",
    description: "Get familiar with the evidence before going deeper.",
    features: [
      "Interactive sample report",
      "See the source-trail format",
      "No wallet connection",
    ],
    button: "Explore the sample",
    href: "#evidence",
  },
  {
    name: "Closer look",
    label: "FOR THE NEXT QUESTION",
    price: "5",
    suffix: "for 3 investigations",
    description: "A focused investigation, with the details that matter.",
    features: [
      "Fresh, bounded investigations",
      "Audit and contract context",
      "Recent security developments",
    ],
    button: "View planned access",
    featured: true,
  },
  {
    name: "Shared perspective",
    label: "FOR YOUR COMMUNITY",
    price: "49",
    suffix: "/ month · 30 investigations",
    description: "Give your community a common place to start.",
    features: [
      "30 investigation credits",
      "Shareable evidence reports",
      "A consistent review format",
    ],
    button: "View community plan",
  },
];

export default function Pricing({ onPlan }) {
  return (
    <section className="pricing-section" id="pricing">
      <div className="container">
        <SectionLabel number="04">A CLEAR EXCHANGE</SectionLabel>
        <div className="section-heading">
          <h2>
            A little clarity.
            <br />
            <em>Without a big commitment.</em>
          </h2>
          <p>
            Start with the sample. Paid investigations are planned for launch,
            with clear limits and no unlimited promises.
          </p>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`pricing-card ${plan.featured ? "pricing-featured" : ""}`}
            >
              <div className="plan-label">
                {plan.label}
                {plan.featured && <span>PLANNED</span>}
              </div>
              <h3>{plan.name}</h3>
              <div className="price">
                <span>$</span>
                {plan.price}
              </div>
              <div className="price-suffix">{plan.suffix}</div>
              <p>{plan.description}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check size={15} />
                    {feature}
                  </li>
                ))}
              </ul>
              {plan.href ? (
                <a href={plan.href} className="button button-outline">
                  {plan.button}
                  <ArrowUpRight size={17} />
                </a>
              ) : (
                <button
                  className={`button ${plan.featured ? "button-blue" : "button-outline"}`}
                  onClick={() => onPlan(plan.name)}
                >
                  {plan.button}
                  <ArrowUpRight size={17} />
                </button>
              )}
            </article>
          ))}
        </div>
        <p className="pricing-note">
          Indicative launch pricing. Paid plans are not available in this
          preview. One investigation covers one selected target within defined
          limits.
        </p>
      </div>
    </section>
  );
}
