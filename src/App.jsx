import { useRef } from "react";
import useScrollMotion from "./hooks/useScrollMotion";
import Header from "./components/Header";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import EvidenceExplorer from "./components/EvidenceExplorer";
import Principles from "./components/Principles";
import WhyWeBuiltIt from "./components/WhyWeBuiltIt";
import FeatureRoadmap from "./components/FeatureRoadmap";
import FAQ from "./components/FAQ";
import InvestigationForm from "./components/InvestigationForm";
import Footer from "./components/Footer";

export default function App() {
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
        <InvestigationForm />
        <HowItWorks />
        <EvidenceExplorer />
        <WhyWeBuiltIt />
        <Principles />
        <FeatureRoadmap />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
