import type { TelemetryProvider } from '@/telemetry/types';

export const AUDIO_FFT_BINS = 32;

const EMIT_INTERVAL_MS = 50;
const SYNTHETIC_SMOOTHING = 0.7;

function nextSyntheticFrame(previous: number[] | null): number[] {
  const frame = new Array<number>(AUDIO_FFT_BINS);
  for (let i = 0; i < AUDIO_FFT_BINS; i++) {
    const target = Math.random() * (1 - (i / AUDIO_FFT_BINS) * 0.6);
    const prev = previous?.[i] ?? target;
    frame[i] = prev * SYNTHETIC_SMOOTHING + target * (1 - SYNTHETIC_SMOOTHING);
  }
  return frame;
}

export const browserAudioFftProvider: TelemetryProvider<number[]> = {
  isAvailable() {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.mediaDevices?.getUserMedia === 'function' &&
      typeof window !== 'undefined' &&
      typeof window.AudioContext === 'function'
    );
  },

  subscribe(emit) {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let stream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;
    let syntheticFrame: number[] | null = null;

    const emitSynthetic = () => {
      syntheticFrame = nextSyntheticFrame(syntheticFrame);
      emit(syntheticFrame);
    };

    // isAvailable() only proves the API exists, not that the user will grant
    // the mic prompt — so we start on synthetic data immediately (satisfying
    // "emit at least once") and only swap to real analyser data once
    // getUserMedia resolves. If it rejects (denied / no mic), this interval
    // just keeps running, which is the graceful-degradation this channel is
    // responsible for per types.ts's TelemetryProvider doc comment.
    emitSynthetic();
    intervalId = setInterval(emitSynthetic, EMIT_INTERVAL_MS);

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((mediaStream) => {
        if (cancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        stream = mediaStream;
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(mediaStream);
        const analyser = audioContext.createAnalyser();
        // fftSize 64 -> frequencyBinCount 32, exactly AUDIO_FFT_BINS, so no
        // downsampling/binning step is needed.
        analyser.fftSize = AUDIO_FFT_BINS * 2;
        source.connect(analyser);

        const rawBins = new Uint8Array(analyser.frequencyBinCount);

        if (intervalId !== null) clearInterval(intervalId);
        intervalId = setInterval(() => {
          analyser.getByteFrequencyData(rawBins);
          const frame = new Array<number>(AUDIO_FFT_BINS);
          for (let i = 0; i < AUDIO_FFT_BINS; i++) {
            frame[i] = rawBins[i] / 255;
          }
          emit(frame);
        }, EMIT_INTERVAL_MS);
      })
      .catch(() => {
        // Denied/unavailable — the synthetic interval started above already
        // covers this channel indefinitely, nothing further to do.
      });

    return () => {
      cancelled = true;
      if (intervalId !== null) clearInterval(intervalId);
      stream?.getTracks().forEach((track) => track.stop());
      void audioContext?.close();
    };
  },
};
