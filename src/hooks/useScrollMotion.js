import { useEffect } from "react";

const revealGroups = [
  ".hero-copy > *",
  ".section-label, .section-heading",
  ".steps-grid > .step",
  ".evidence-tabs, .evidence-panel",
  ".why-eyebrow, .why-footnote",
  ".principles-copy, .principles-list > article",
  ".pricing-grid > article",
  ".faq-section h2, .faq-section details",
  ".investigate-section > .container, .footer-top",
];

/** Progressive enhancement: all content remains readable without motion. */
export default function useScrollMotion(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let dispose = () => {};

    function setup() {
      dispose();
      if (preference.matches || !window.IntersectionObserver) return;
      const elements = [];
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(({ target, isIntersecting }) => {
            if (!isIntersecting) return;
            target.classList.add("motion-visible");
            observer.unobserve(target);
          });
        },
        { threshold: 0.08 },
      );

      revealGroups.forEach((selector) => {
        root.querySelectorAll(selector).forEach((element, index) => {
          element.classList.add("motion-reveal");
          element.style.setProperty("--reveal-delay", `${(index % 3) * 85}ms`);
          observer.observe(element);
          elements.push(element);
        });
      });

      const statement = root.querySelector(".why-section");
      const scene = root.querySelector(".report-scene");
      let frame = 0;
      const clamp = (value) => Math.max(0, Math.min(1, value));
      function render() {
        frame = 0;
        const height = window.innerHeight;
        const pageLength = document.documentElement.scrollHeight - height;
        root.style.setProperty(
          "--page-progress",
          clamp(window.scrollY / Math.max(1, pageLength)),
        );
        if (statement) {
          const box = statement.getBoundingClientRect();
          const progress = clamp((height * 0.85 - box.top) / (height * 0.65));
          statement.style.setProperty("--ink-progress", `${progress * 100}%`);
        }
        if (scene) {
          const box = scene.getBoundingClientRect();
          const shift =
            window.innerWidth > 850
              ? Math.max(-24, Math.min(24, -box.top * 0.045))
              : 0;
          scene.style.setProperty("--scene-shift", `${shift}px`);
        }
      }
      function schedule() {
        if (!frame) frame = requestAnimationFrame(render);
      }
      function showFocused(event) {
        const target = event.target.closest(".motion-reveal");
        target?.classList.add("motion-visible");
      }
      root.classList.add("motion-enabled");
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      root.addEventListener("focusin", showFocused);
      const resize = new ResizeObserver(schedule);
      resize.observe(root);
      render();
      dispose = () => {
        observer.disconnect();
        resize.disconnect();
        cancelAnimationFrame(frame);
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
        root.removeEventListener("focusin", showFocused);
        root.classList.remove("motion-enabled");
        root.style.removeProperty("--page-progress");
        statement?.style.removeProperty("--ink-progress");
        scene?.style.removeProperty("--scene-shift");
        elements.forEach((element) => {
          element.classList.remove("motion-reveal", "motion-visible");
          element.style.removeProperty("--reveal-delay");
        });
      };
    }
    setup();
    preference.addEventListener("change", setup);
    return () => {
      dispose();
      preference.removeEventListener("change", setup);
    };
  }, [rootRef]);
}
