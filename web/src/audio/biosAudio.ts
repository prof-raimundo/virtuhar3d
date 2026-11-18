export type AudioCueType = 'post_ok' | 'erro' | 'encaixe';

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) {
    return null;
  }
  if (!sharedAudioContext) {
    try {
      sharedAudioContext = new Ctor();
    } catch {
      return null;
    }
  }
  if (sharedAudioContext.state === 'suspended') {
    void sharedAudioContext.resume().catch(() => undefined);
  }
  return sharedAudioContext;
}

function playTone(
  ctx: AudioContext,
  freqHz: number,
  startOffsetSec: number,
  durationSec: number,
  type: OscillatorType,
  gainValue: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqHz, ctx.currentTime + startOffsetSec);

  gain.gain.setValueAtTime(0.0001, ctx.currentTime + startOffsetSec);
  gain.gain.exponentialRampToValueAtTime(gainValue, ctx.currentTime + startOffsetSec + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startOffsetSec + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + startOffsetSec);
  osc.stop(ctx.currentTime + startOffsetSec + durationSec + 0.02);
}

const CAPTIONS: Record<AudioCueType, string> = {
  post_ok: 'Legenda de áudio: 1 bipe curto (1000 Hz) — POST concluído sem erros.',
  erro: 'Legenda de áudio: 2 bipes graves (440 Hz) — Ação recusada pela verificação.',
  encaixe: 'Legenda de áudio: clique de confirmação — Componente posicionado.',
};

export function emitAudioCue(cue: AudioCueType, muted: boolean): string {
  const caption = CAPTIONS[cue];
  if (muted) {
    return caption;
  }

  const ctx = getAudioContext();
  if (!ctx) {
    return caption;
  }

  try {
    if (cue === 'post_ok') {
      playTone(ctx, 1000, 0, 0.14, 'square', 0.06);
    } else if (cue === 'erro') {
      playTone(ctx, 440, 0, 0.09, 'sawtooth', 0.05);
      playTone(ctx, 370, 0.13, 0.11, 'sawtooth', 0.05);
    } else {
      playTone(ctx, 720, 0, 0.04, 'triangle', 0.04);
    }
  } catch {
    // Silencia falhas de autoplay em ambientes headless sem suporte a áudio
  }

  return caption;
}
