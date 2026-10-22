// Demo-branch only: renders the dedicated concept video (silent, fixture data).
// Never merged to main. Usage: node server/scripts/demo-video.js [out.mp4]
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..");
const out = resolve(process.argv[2] || ".promptible/demo-candidate.mp4");
const { bundle } = await import("@remotion/bundler");
const { selectComposition, renderMedia } = await import("@remotion/renderer");
console.log("bundling…");
const bundlePath = await bundle({ entryPoint: resolve(root, "server/remotion/demo.jsx") });
const composition = await selectComposition({ serveUrl: bundlePath, id: "TrustLensDemo", inputProps: {} });
console.log("rendering…");
await renderMedia({
  composition,
  serveUrl: bundlePath,
  codec: "h264",
  outputLocation: out,
  inputProps: {},
  concurrency: 1,
  timeoutInMilliseconds: 600000,
});
console.log(JSON.stringify({ status: "rendered", file: out }));
