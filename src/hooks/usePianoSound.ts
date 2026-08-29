import { useCallback, useRef } from "react";
import { midiToFrequency } from "../lib/notes";

const ATTACK_SECONDS = 0.01;
const DECAY_SECONDS = 0.6;
const PEAK_GAIN = 0.25;

/**
 * Returns a function that plays a short synthesized tone for a MIDI note via
 * the Web Audio API, when `enabled`. The AudioContext is created lazily on
 * the first note — browsers block audio started before a user gesture, and
 * a piano key press is that gesture — and reused for every note after that.
 */
export function usePianoSound(enabled: boolean): (midi: number) => void {
  const contextRef = useRef<AudioContext | null>(null);

  return useCallback(
    (midi: number) => {
      if (!enabled) return;

      const context = contextRef.current ?? new AudioContext();
      contextRef.current = context;
      if (context.state === "suspended") void context.resume();

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.value = midiToFrequency(midi);

      const now = context.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(PEAK_GAIN, now + ATTACK_SECONDS);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + DECAY_SECONDS);

      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + DECAY_SECONDS);
    },
    [enabled],
  );
}
