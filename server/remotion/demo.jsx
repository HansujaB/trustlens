import React from "react";
import {
  AbsoluteFill,
  Composition,
  interpolate,
  registerRoot,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const INK = "#122145";
const BLUE = "#315ed8";
const BG = "#f5f7ff";
const RULE = "#dce4ff";
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "Arial, Helvetica, sans-serif";
const MONO = "'Courier New', monospace";

const SIG = "5nP5QNB2W7butQry6BjutpcQap35rAuvbKKs41mjnqBQt3H9iqMYr9Q4zJHDNPUgGFZXngFe1P3cG5aChDik23FP";
const short = (v) => `${v.slice(0, 6)}…${v.slice(-6)}`;

function Eyebrow({ children }) {
  return (
    <div style={{ color: BLUE, fontSize: 26, letterSpacing: 4, fontFamily: SANS }}>
      {children}
    </div>
  );
}

function Enter({ start, children, style }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: Math.max(0, frame - start), fps, config: { damping: 100, stiffness: 180 } });
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const dy = interpolate(s, [0, 1], [36, 0]);
  return <div style={{ opacity, transform: `translateY(${dy}px)`, ...style }}>{children}</div>;
}

function Rule({ start, end }) {
  const frame = useCurrentFrame();
  const w = interpolate(frame, [start, end], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <div style={{ height: 8, background: RULE, marginTop: 28 }}><div style={{ width: `${w}%`, height: "100%", background: BLUE }} /></div>;
}

/** Camera: hold → travel → hold down the stage column. */
function useCameraY() {
  const frame = useCurrentFrame();
  const seg = (a, b, from, to) => interpolate(frame, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (frame < 60) return 0;
  if (frame < 85) return seg(60, 85, 0, -1080);
  if (frame < 140) return -1080;
  if (frame < 160) return seg(140, 160, -1080, -2160);
  if (frame < 205) return -2160;
  if (frame < 225) return seg(205, 225, -2160, -3240);
  if (frame < 265) return -3240;
  if (frame < 290) return seg(265, 290, -3240, -4320);
  return -4320;
}

function Panel({ children }) {
  return (
    <div style={{ height: 1080, width: 1920, padding: "90px 140px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
      {children}
      <div style={{ position: "absolute", right: 60, bottom: 36, fontSize: 22, letterSpacing: 3, color: "#6d7c94", fontFamily: SANS }}>
        CONCEPT PREVIEW
      </div>
    </div>
  );
}

function Thread() {
  const frame = useCurrentFrame();
  const h = interpolate(frame, [40, 290], [0, 4320], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const arrivals = [40, 100, 170, 235, 290];
  const stops = [60, 1140, 2220, 3300, 4380];
  return (
    <>
      <div style={{ position: "absolute", left: 88, top: 0, width: 10, height: h, background: BLUE, opacity: 0.9 }} />
      {stops.map((y, i) => {
        const on = interpolate(frame, [arrivals[i], arrivals[i] + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={i} style={{ position: "absolute", left: 76, top: y - 18, width: 34, height: 34, borderRadius: "50%", background: on ? BLUE : "#ffffff", border: `5px solid ${BLUE}`, opacity: 0.35 + 0.65 * on }} />
        );
      })}
    </>
  );
}

function Payoff({ children }) {
  return (
    <div style={{ height: 1080, width: 1920, padding: "90px 140px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", background: INK, color: "#ffffff" }}>
      {children}
      <div style={{ position: "absolute", right: 60, bottom: 36, fontSize: 22, letterSpacing: 3, color: "#9fb0c8", fontFamily: SANS }}>
        CONCEPT PREVIEW
      </div>
    </div>
  );
}

function Film() {
  const cameraY = useCameraY();
  return (
    <AbsoluteFill style={{ background: BG, color: INK, fontFamily: SANS, overflow: "hidden" }}>
      <div style={{ transform: `translateY(${cameraY}px)`, width: 1920 }}>
        <Thread />
        <Panel>
          <Enter start={0}><Eyebrow>TRUSTLENS · INPUT · SIGNATURE</Eyebrow></Enter>
          <Enter start={10}>
            <div style={{ fontFamily: MONO, fontSize: 34, marginTop: 36, overflowWrap: "anywhere", lineHeight: 1.6 }}>{SIG}</div>
          </Enter>
          <Enter start={18}><div style={{ fontSize: 30, marginTop: 30, color: BLUE }}>Analyzing transaction…</div></Enter>
          <div style={{ marginTop: 20, width: 900 }}><Rule start={5} end={60} /></div>
        </Panel>
        <Panel>
          <Enter start={70}><Eyebrow>TRUSTLENS · DECODED · SWAP</Eyebrow></Enter>
          <Enter start={78}>
            <div style={{ fontFamily: SERIF, fontSize: 88, lineHeight: 1.15, marginTop: 24 }}>
              Swapped 2.4 SOL for 312.86 USDC via Jupiter.
            </div>
          </Enter>
          <Enter start={90}>
            <div style={{ fontSize: 34, marginTop: 34 }}>
              <div><strong>HfvR…mJEbS</strong> sent <strong>2.4 SOL</strong></div>
              <div style={{ marginTop: 12 }}><strong>HfvR…mJEbS</strong> received <strong>312.86 USDC</strong></div>
            </div>
          </Enter>
          <div style={{ width: 900 }}><Rule start={96} end={132} /></div>
          <Enter start={106}><div style={{ fontSize: 28, marginTop: 22 }}>Fee: 0.000005 SOL (5000 lamports).</div></Enter>
        </Panel>
        <Panel>
          <Enter start={143}><Eyebrow>TRUSTLENS · EVIDENCE · SOURCES</Eyebrow></Enter>
          <Enter start={152}>
            <div style={{ marginTop: 30, borderLeft: `8px solid ${BLUE}`, background: "#ffffff", padding: "30px 40px" }}>
              <div style={{ fontSize: 36, color: BLUE }}>Jupiter Swap API</div>
              <div style={{ fontSize: 30, marginTop: 12 }}>USDC · EPjF…TDt1v · exact_identifier_mention</div>
            </div>
          </Enter>
          <Enter start={170}>
            <div style={{ marginTop: 26, borderLeft: `8px solid ${BLUE}`, background: "#ffffff", padding: "30px 40px" }}>
              <div style={{ fontSize: 36, color: BLUE }}>Solana Token Program</div>
              <div style={{ fontSize: 30, marginTop: 12 }}>Mint address alone does not certify the issuer.</div>
            </div>
          </Enter>
        </Panel>
        <Panel>
          <Enter start={208}><Eyebrow>TRUSTLENS · ESTIMATE · TRADE</Eyebrow></Enter>
          <Enter start={215}>
            <div style={{ fontFamily: SERIF, fontSize: 120, marginTop: 20 }}>−0.34%</div>
          </Enter>
          <Enter start={223}>
            <div style={{ fontSize: 30, marginTop: 16 }}>vs execution-time market sample · fee excluded · 1 SOL = 130.36 USDC executed</div>
          </Enter>
        </Panel>
        <Payoff>
          <Enter start={273}><Eyebrow>TRUSTLENS · VERDICT · SHARE</Eyebrow></Enter>
          <Enter start={282}>
            <div style={{ fontFamily: SERIF, fontSize: 96, marginTop: 24 }}>trustlens<span style={{ color: "#8fb0ff" }}>.</span></div>
          </Enter>
          <Enter start={292}>
            <div style={{ fontSize: 36, marginTop: 24 }}>Swapped 2.4 SOL for 312.86 USDC — fully decoded.</div>
          </Enter>
          <Enter start={300}>
            <div style={{ fontSize: 30, marginTop: 16, color: "#c6d2ea" }}>Read-only · No signing · No broadcasting</div>
          </Enter>
        </Payoff>
      </div>
    </AbsoluteFill>
  );
}

registerRoot(() => (
  <Composition
    id="TrustLensDemo"
    component={Film}
    fps={30}
    width={1920}
    height={1080}
    durationInFrames={360}
  />
));
