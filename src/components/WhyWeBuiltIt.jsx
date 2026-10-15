const paperEdge =
  "M0 20 L22 19 L43 25 L65 21 L87 26 L109 15 L130 23 L152 11 L174 21 L196 18 L219 26 L242 29 L263 32 L285 30 L307 22 L329 34 L351 31 L374 28 L396 37 L418 34 L440 27 L462 35 L484 23 L506 31 L528 28 L550 21 L572 26 L594 21 L616 15 L638 13 L660 8 L682 26 L704 20 L726 25 L748 19 L770 25 L792 20 L814 36 L836 33 L858 27 L880 35 L902 39 L924 25 L946 37 L968 31 L990 31 L1012 27 L1034 29 L1056 15 L1078 18 L1100 11 L1122 18 L1144 19 L1166 27 L1188 23 L1210 12 L1232 27 L1254 29 L1280 34";

export default function WhyWeBuiltIt() {
  return (
    <section className="why-section" aria-labelledby="why-heading">
      <svg
        className="paper-divider"
        viewBox="0 0 1280 52"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d={`${paperEdge} L1280 52 L0 52 Z`}
          className="paper-divider-fill"
        />
        <path d={paperEdge} className="paper-divider-edge" />
      </svg>
      <div className="container why-content">
        <p className="why-eyebrow">
          <span /> WHY WE BUILT IT
        </p>
        <h2 id="why-heading" className="why-statement">
          Anyone can make a promise.{" "}
          <br className="why-desktop-break" />
          We help you find the <em>proof.</em>
          <span className="why-outline">
            Less blind trust. More <em>eyes open.</em>
          </span>
        </h2>
        <div className="why-footnote">
          <span className="why-rule" aria-hidden="true" />
          <p>
            Because understanding what you’re trusting should come before
            connecting your wallet.
          </p>
        </div>
      </div>
    </section>
  );
}
