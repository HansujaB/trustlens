import React from 'react';
import { AbsoluteFill, Audio, Composition, Sequence, interpolate, registerRoot, staticFile, useCurrentFrame } from 'remotion';
const short = value => value ? `${value.slice(0, 7)}…${value.slice(-7)}` : '';
function Scene({ scene, status }) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, Math.max(1, scene.durationInFrames - 15)], [0, 100], { extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ background: '#f5f7ff', padding: 70, color: '#122145', fontFamily: 'Arial', justifyContent: 'center' }}>
    <div style={{ position: 'absolute', top: 40, left: 70, color: '#315ed8', fontSize: 24 }}>TRUSTLENS · {status.toUpperCase()} · {scene.kind}</div>
    {scene.source && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 25, marginBottom: 35 }}><span>{short(scene.source)}</span><strong>{scene.amount} {scene.asset === 'SOL' ? 'SOL' : 'tokens'}</strong><span>{short(scene.destination)}</span></div>}
    {scene.source && <div style={{ height: 6, background: '#dce4ff', marginBottom: 35 }}><div style={{ width: `${progress}%`, height: '100%', background: status === 'failed' ? '#b76b18' : '#315ed8' }} /></div>}
    <div style={{ fontSize: 28, lineHeight: 1.5, overflowWrap: 'anywhere' }}>{scene.text}</div>
    <div style={{ position: 'absolute', bottom: 30, fontSize: 16 }}>{status === 'failed' ? 'Requested movements did not complete. Fees may still apply.' : 'Instruction movements and net balance changes are different views.'}</div>
    <Audio src={staticFile(scene.audio)} />
  </AbsoluteFill>;
}
function Film({ scenes, status }) { return <AbsoluteFill>{scenes.map((scene, i) => <Sequence key={i} from={scene.from} durationInFrames={scene.durationInFrames}><Scene scene={scene} status={status} /></Sequence>)}</AbsoluteFill>; }
registerRoot(() => <Composition id="TrustLens" component={Film} fps={30} width={1280} height={720} durationInFrames={30} defaultProps={{ scenes: [], durationInFrames: 30, status: 'success' }} calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames })} />);
