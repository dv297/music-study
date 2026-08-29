import { useEffect, useMemo, useRef } from "react";
import { usePianoSound } from "../hooks/usePianoSound";
import { isBlackKey, midiToName, octaveOfMidi, pitchClassOfMidi } from "../lib/notes";

export type KeyMark = "correct" | "extra" | "missing";

interface PianoProps {
  lowMidi: number;
  highMidi: number;
  selected: ReadonlySet<number>;
  onToggle: (midi: number) => void;
  /** Post-submission feedback, keyed by MIDI number. */
  marks?: ReadonlyMap<number, KeyMark>;
  showNoteNames?: boolean;
  disabled?: boolean;
  /** Plays a synthesized tone when a key is pressed (not released). */
  playSound?: boolean;
}

/**
 * Computer-keyboard mapping, offset in semitones from the lowest key. The
 * two rows mirror the octaves the way a DAW's typing keyboard does.
 */
const TYPING_KEYS: Record<string, number> = {
  z: 0,
  s: 1,
  x: 2,
  d: 3,
  c: 4,
  v: 5,
  g: 6,
  b: 7,
  h: 8,
  n: 9,
  j: 10,
  m: 11,
  ",": 12,
  q: 12,
  "2": 13,
  w: 14,
  "3": 15,
  e: 16,
  r: 17,
  "5": 18,
  t: 19,
  "6": 20,
  y: 21,
  "7": 22,
  u: 23,
  i: 24,
};

interface PlacedKey {
  midi: number;
  black: boolean;
  /** Index into the white keys; black keys sit on the boundary before it. */
  whiteIndex: number;
}

function layOutKeys(lowMidi: number, highMidi: number): { keys: PlacedKey[]; whiteCount: number } {
  const keys: PlacedKey[] = [];
  let whiteIndex = 0;
  for (let midi = lowMidi; midi <= highMidi; midi++) {
    const black = isBlackKey(midi);
    keys.push({ midi, black, whiteIndex });
    if (!black) whiteIndex++;
  }
  return { keys, whiteCount: whiteIndex };
}

export function Piano({
  lowMidi,
  highMidi,
  selected,
  onToggle,
  marks,
  showNoteNames = false,
  disabled = false,
  playSound = false,
}: PianoProps) {
  const { keys, whiteCount } = useMemo(() => layOutKeys(lowMidi, highMidi), [lowMidi, highMidi]);
  const playNote = usePianoSound(playSound);

  // Kept in sync via effect (rather than read during render) so the
  // keyboard handler below can check it without needing `selected` in its
  // own deps — that would reinstall the listener on every keystroke.
  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  });

  useEffect(() => {
    if (disabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      const offset = TYPING_KEYS[event.key.toLowerCase()];
      if (offset === undefined) return;
      const midi = lowMidi + offset;
      if (midi > highMidi) return;
      event.preventDefault();
      if (!selectedRef.current.has(midi)) playNote(midi);
      onToggle(midi);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [disabled, highMidi, lowMidi, onToggle, playNote]);

  // A fresh closure each render (same as PianoKey's own onClick), so it's
  // always consistent with the latest `selected` without needing a ref.
  const handleToggle = (midi: number) => {
    if (!selected.has(midi)) playNote(midi);
    onToggle(midi);
  };

  const whiteWidth = 100 / whiteCount;

  return (
    <div className="piano" role="group" aria-label="Piano keyboard">
      <div className="piano-keys">
        {keys
          .filter((key) => !key.black)
          .map((key) => (
            <PianoKey
              key={key.midi}
              midi={key.midi}
              black={false}
              style={{ width: `${whiteWidth}%` }}
              selected={selected.has(key.midi)}
              mark={marks?.get(key.midi)}
              showNoteNames={showNoteNames}
              disabled={disabled}
              onToggle={handleToggle}
            />
          ))}
        {keys
          .filter((key) => key.black)
          .map((key) => (
            <PianoKey
              key={key.midi}
              midi={key.midi}
              black
              style={{
                width: `${whiteWidth * 0.62}%`,
                left: `${key.whiteIndex * whiteWidth - whiteWidth * 0.31}%`,
              }}
              selected={selected.has(key.midi)}
              mark={marks?.get(key.midi)}
              showNoteNames={showNoteNames}
              disabled={disabled}
              onToggle={handleToggle}
            />
          ))}
      </div>
    </div>
  );
}

interface PianoKeyProps {
  midi: number;
  black: boolean;
  style: React.CSSProperties;
  selected: boolean;
  mark: KeyMark | undefined;
  showNoteNames: boolean;
  disabled: boolean;
  onToggle: (midi: number) => void;
}

function PianoKey({ midi, black, style, selected, mark, showNoteNames, disabled, onToggle }: PianoKeyProps) {
  const name = midiToName(midi);
  const isC = pitchClassOfMidi(midi) === 0;
  const label = showNoteNames ? name.replace(/\d$/, "") : isC ? `C${octaveOfMidi(midi)}` : "";

  const className = ["key", black ? "key-black" : "key-white", selected ? "is-selected" : "", mark ? `is-${mark}` : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={className}
      style={style}
      aria-label={name}
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onToggle(midi)}
    >
      {label && <span className="key-label">{label}</span>}
    </button>
  );
}
