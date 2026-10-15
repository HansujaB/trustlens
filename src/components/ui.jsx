import { ArrowUpRight, Check, Search } from "lucide-react";

export function Brand({ light = false }) {
  return (
    <a
      className={`brand ${light ? "brand-light" : ""}`}
      href="#top"
      aria-label="TrustLens home"
    >
      <span className="brand-symbol">
        <Search size={23} strokeWidth={1.8} />
        <Check className="brand-check" size={11} strokeWidth={2.4} />
      </span>
      <span>
        trustlens<span className="brand-period">.</span>
      </span>
    </a>
  );
}

export function SectionLabel({ number, children, light = false }) {
  return (
    <div className={`section-label ${light ? "label-light" : ""}`}>
      <span className="label-index">{number}</span>
      <span>{children}</span>
    </div>
  );
}

export function ActionLink({
  href,
  children,
  secondary = false,
  className = "",
  ...props
}) {
  return (
    <a
      href={href}
      className={`${secondary ? "text-link" : "button button-blue"} ${className}`}
      {...props}
    >
      {children}
      <ArrowUpRight size={17} />
    </a>
  );
}

export function Status({ type, children }) {
  return (
    <span className={`status status-${type}`}>
      <span />
      {children}
    </span>
  );
}
