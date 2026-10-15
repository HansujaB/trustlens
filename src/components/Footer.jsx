import { ArrowUp, ArrowUpRight } from "lucide-react";
import { Brand } from "./ui";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Brand />
            <p>A clearer view of what’s behind the claims.</p>
          </div>
          <nav aria-label="Footer navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#evidence">
              Sample report <ArrowUpRight size={12} />
            </a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">Questions</a>
          </nav>
          <a href="#top" className="back-top" aria-label="Back to top">
            <ArrowUp size={19} />
          </a>
        </div>
        <div className="footer-wordmark" aria-hidden="true">
          trustlens<span>.</span>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} TrustLens</span>
          <span>Evidence informs. It doesn’t guarantee.</span>
          <span>MADE FOR A CLOSER LOOK ↗</span>
        </div>
      </div>
    </footer>
  );
}
