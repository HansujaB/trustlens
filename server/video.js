import { mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { ApiError, requireThat, request } from './util.js';

export function scenesFor(report) {
  requireThat(report.kind === 'transaction', 422, 'VIDEO_UNSUPPORTED', 'Videos are available for executed transaction reports.');
  const steps = report.explanation.steps;
  requireThat(steps.length <= 16, 422, 'VIDEO_TOO_COMPLEX', 'This report exceeds the 16-scene video limit. The full text remains available.');
  return [{ text: report.explanation.headline, kind: 'intro' }, ...steps, { text: 'Only supported instructions were explained. Source context and full details are in the report. This video does not certify safety.', kind: 'outro' }].map(s => ({ ...s, narration: s.text.replace(/[1-9A-HJ-NP-Za-km-z]{32,44}/g, 'the address shown on screen') }));
}
export function wavDuration(buffer) {
  requireThat(buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WAVE', 502, 'INVALID_AUDIO', 'TTS must return WAV audio.');
  let byteRate, dataSize;
  for (let offset = 12; offset + 8 <= buffer.length;) {
    const name = buffer.toString('ascii', offset, offset + 4), size = buffer.readUInt32LE(offset + 4);
    requireThat(offset + 8 + size <= buffer.length, 502, 'INVALID_AUDIO', 'Truncated audio.');
    if (name === 'fmt ' && size >= 16) byteRate = buffer.readUInt32LE(offset + 16);
    if (name === 'data') dataSize = size;
    offset += 8 + size + size % 2;
  }
  requireThat(byteRate > 0 && dataSize > 0, 502, 'INVALID_AUDIO', 'WAV duration is unavailable.');
  return dataSize / byteRate;
}
export class Videos {
  constructor(config, fetchImpl = fetch) { this.config = config; this.fetchImpl = fetchImpl; this.busy = false; }
  available() { return Boolean(this.config.videoEnabled && this.config.ttsUrl && this.config.ttsKey && this.config.ttsModel && this.config.ttsVoice); }
  async render(report, videoId, stage, signal) {
    requireThat(this.available(), 503, 'VIDEO_NOT_CONFIGURED', 'Narrated video rendering requires VIDEO_ENABLED and TTS configuration.');
    requireThat(!this.busy, 503, 'RENDER_BUSY', 'A video is rendering. Retry after it completes.');
    this.busy = true;
    const root = join(this.config.dataDir, 'videos', videoId), audioDir = join(root, 'audio');
    let bundlePath;
    try {
      await mkdir(audioDir, { recursive: true });
      const scenes = scenesFor(report); let totalFrames = 0;
      stage('narration');
      for (let i = 0; i < scenes.length; i++) {
        signal?.throwIfAborted();
        const audio = await request(this.config.ttsUrl, { method: 'POST', headers: { Authorization: `Bearer ${this.config.ttsKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: this.config.ttsModel, voice: this.config.ttsVoice, input: scenes[i].narration, response_format: 'wav' }), signal }, { parse: null, maxBytes: 8_000_000, timeout: 60000, retries: 0, fetchImpl: this.fetchImpl });
        const duration = wavDuration(audio);
        requireThat(duration <= 60, 502, 'AUDIO_TOO_LONG', 'A narration scene exceeded one minute.');
        scenes[i] = { ...scenes[i], audio: `${i}.wav`, from: totalFrames, durationInFrames: Math.ceil((duration + 0.5) * 30) };
        totalFrames += scenes[i].durationInFrames;
        requireThat(totalFrames <= 30 * 300, 422, 'VIDEO_TOO_LONG', 'The narration exceeds five minutes.');
        await writeFile(join(audioDir, `${i}.wav`), audio);
      }
      stage('rendering'); signal?.throwIfAborted();
      const { bundle } = await import('@remotion/bundler');
      const { selectComposition, renderMedia, makeCancelSignal } = await import('@remotion/renderer');
      bundlePath = await bundle({ entryPoint: resolve('server/remotion/index.jsx'), publicDir: audioDir });
      const inputProps = { scenes, durationInFrames: totalFrames, status: report.facts.status };
      const composition = await selectComposition({ serveUrl: bundlePath, id: 'TrustLens', inputProps });
      const { cancelSignal, cancel } = makeCancelSignal();
      const abort = () => cancel(); signal?.addEventListener('abort', abort, { once: true });
      try {
        signal?.throwIfAborted();
        await renderMedia({ composition, serveUrl: bundlePath, codec: 'h264', outputLocation: join(root, 'explainer.mp4'), inputProps, cancelSignal, concurrency: 1, timeoutInMilliseconds: 60000 });
      } finally { signal?.removeEventListener('abort', abort); }
      await writeFile(join(root, 'transcript.txt'), scenes.map(s => s.text).join('\n\n'));
      return { file: join(root, 'explainer.mp4'), transcript: scenes.map(s => s.text).join('\n\n'), durationSeconds: totalFrames / 30 };
    } catch (error) {
      await rm(root, { recursive: true, force: true });
      throw error instanceof ApiError ? error : new ApiError(502, 'VIDEO_FAILED', 'Video generation failed. Check the server renderer configuration.');
    } finally {
      if (bundlePath) await rm(bundlePath, { recursive: true, force: true });
      this.busy = false;
    }
  }
}
