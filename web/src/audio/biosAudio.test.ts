import { afterEach, describe, expect, it, vi } from 'vitest';
import { emitAudioCue } from './biosAudio.js';

describe('biosAudio — legendas visuais acessíveis para bipes (ADR-14)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retorna legenda visual explícita para POST, erro e encaixe mesmo em ambiente mudo ou sem AudioContext', () => {
    expect(emitAudioCue('post_ok', false)).toContain('1 bipe curto');
    expect(emitAudioCue('post_ok', true)).toContain('POST concluído');
    expect(emitAudioCue('erro', false)).toContain('2 bipes graves');
    expect(emitAudioCue('encaixe', true)).toContain('Componente posicionado');
  });

  it('aciona AudioContext com osciladores e retoma contexto suspenso quando não está mudo', () => {
    const startMock = vi.fn();
    const stopMock = vi.fn();
    const connectOscMock = vi.fn();
    const connectGainMock = vi.fn();
    const resumeMock = vi.fn().mockResolvedValue(undefined);

    class FakeAudioContext {
      state = 'suspended';
      currentTime = 1.0;
      destination = {};
      resume = resumeMock;
      createOscillator() {
        return {
          type: 'sine',
          frequency: { setValueAtTime: vi.fn() },
          connect: connectOscMock,
          start: startMock,
          stop: stopMock,
        };
      }
      createGain() {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: connectGainMock,
        };
      }
    }

    vi.stubGlobal('window', { AudioContext: FakeAudioContext });

    expect(emitAudioCue('post_ok', false)).toContain('1 bipe curto');
    expect(emitAudioCue('erro', false)).toContain('2 bipes graves');
    expect(emitAudioCue('encaixe', false)).toContain('Componente posicionado');

    expect(resumeMock).toHaveBeenCalled();
    expect(startMock).toHaveBeenCalledTimes(4);
    expect(stopMock).toHaveBeenCalledTimes(4);
  });
});
