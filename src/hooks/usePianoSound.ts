import { useCallback, useRef } from "react";
import { midiToFrequency } from "../lib/notes";

const ATTACK_SECONDS = 0.01;
const DECAY_SECONDS = 0.6;
const PEAK_GAIN = 0.25;
/** Gap between the start of consecutive notes in a replayed sequence. */
const REPLAY_STEP_SECONDS = 0.35;

/** Schedules one synthesized tone on `context`, starting at `startTime`. */
function scheduleTone(context: AudioContext, midi: number, startTime: number): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = midiToFrequency(midi);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(PEAK_GAIN, startTime + ATTACK_SECONDS);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + DECAY_SECONDS);

  oscillator.connect(gain).connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + DECAY_SECONDS);
}

/**
 * Returns a function that lazily creates, then reuses, one AudioContext.
 * Creation is deferred to the first call — browsers block audio started
 * before a user gesture, and the first call here is always in response to
 * one (a key press, or a correct answer the user just triggered).
 */
function useAudioContext(): () => AudioContext {
  const contextRef = useRef<AudioContext | null>(null);
  return useCallback(() => {
    const context = contextRef.current ?? new AudioContext();
    contextRef.current = context;
    if (context.state === "suspended") void context.resume();
    return context;
  }, []);
}

/**
 * Returns a function that plays a short synthesized tone for a MIDI note via
 * the Web Audio API, when `enabled`.
 */
export function usePianoSound(enabled: boolean): (midi: number) => void {
  const getContext = useAudioContext();

  return useCallback(
    (midi: number) => {
      if (!enabled) return;
      const context = getContext();
      scheduleTone(context, midi, context.currentTime);
    },
    [enabled, getContext],
  );
}

/**
 * Returns a function that plays a sequence of MIDI note groups, when
 * `enabled` — each group's notes struck together, groups spaced evenly one
 * after another. A one-note group is a single tone; a multi-note group is a
 * block chord. Used to replay a scale (all one-note groups) or a chord (one
 * note at a time, then a final group with every tone) after a correct
 * answer — see `scaleReplayGroups`/`chordReplayGroups` in `src/lib/replay.ts`.
 */
export function useReplaySound(enabled: boolean): (midiGroups: readonly (readonly number[])[]) => void {
  const getContext = useAudioContext();

  return useCallback(
    (midiGroups: readonly (readonly number[])[]) => {
      if (!enabled) return;
      const context = getContext();
      let startTime = context.currentTime;
      for (const group of midiGroups) {
        for (const midi of group) scheduleTone(context, midi, startTime);
        startTime += REPLAY_STEP_SECONDS;
      }
    },
    [enabled, getContext],
  );
}
