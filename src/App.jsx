import { useRef, useState } from "react";
import useScrollMotion from "./hooks/useScrollMotion";
import Header from "./components/Header";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import EvidenceExplorer from "./components/EvidenceExplorer";
import Principles from "./components/Principles";
import WhyWeBuiltIt from "./components/WhyWeBuiltIt";
import Pricing from "./components/Pricing";
import FAQ from "./components/FAQ";
import InvestigationForm from "./components/InvestigationForm";
import Footer from "./components/Footer";
import PreviewDialog from "./components/PreviewDialog";

export default function App() {
  const [dialog, setDialog] = useState(null);
  const pageRef = useRef(null);
  useScrollMotion(pageRef);
  return (
    <div ref={pageRef} className="landing-page">
      <div className="reading-progress" aria-hidden="true" />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div id="top" />
      <Header />
      <main id="main">
        <Hero />
        <HowItWorks />
        <EvidenceExplorer />
        <WhyWeBuiltIt />
        <Principles />
        <Pricing onPlan={(value) => setDialog({ type: "plan", value })} />
        <FAQ />
        <InvestigationForm
          onPreview={(value) => setDialog({ type: "investigation", value })}
        />
      </main>
      <Footer />
      <PreviewDialog state={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}
