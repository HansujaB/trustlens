// Real local render with a synthetic silent WAV provider. No TTS API or claim of spoken narration.
import { Videos } from "../video.js";
import { resolve } from "node:path";
import { stat } from "node:fs/promises";
const wav = Buffer.alloc(44 + 16000);
wav.write("RIFF");
wav.writeUInt32LE(wav.length - 8, 4);
wav.write("WAVE", 8);
wav.write("fmt ", 12);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(8000, 24);
wav.writeUInt32LE(16000, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(16000, 40);
const videos = new Videos(
  {
    videoEnabled: true,
    dataDir: resolve(".data"),
    ttsUrl: "https://fixture.invalid",
    ttsKey: "fixture",
    ttsModel: "fixture",
    ttsVoice: "fixture",
  },
  async () => new Response(wav),
);
const output = await videos.render(
  {
    kind: "transaction",
    facts: { status: "success" },
    explanation: {
      headline: "Illustrative renderer test.",
      steps: [
        {
          kind: "sol_transfer",
          text: "Fixture: transferred 0.000000001 SOL.",
          amount: "0.000000001",
          asset: "SOL",
          source: "11111111111111111111111111111111",
          destination: "So11111111111111111111111111111111111111112",
        },
      ],
    },
  },
  "renderer-smoke",
  console.log,
  new AbortController().signal,
);
console.log(
  JSON.stringify({
    status: "rendered",
    bytes: (await stat(output.file)).size,
    durationSeconds: output.durationSeconds,
    file: output.file,
    narration: "synthetic silence fixture; live TTS not tested",
  }),
);
