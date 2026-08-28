/** Note naming, spelling, and MIDI helpers. */

export const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
export type Letter = (typeof LETTERS)[number];

/** Pitch class of each natural letter. */
const NATURAL_PITCH_CLASS: Record<Letter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** A note name as a letter plus an accidental offset in semitones (-2..2). */
export interface SpelledNote {
  letter: Letter;
  accidental: number;
}

const ACCIDENTAL_NAMES: Record<number, string> = {
  [-2]: "bb",
  [-1]: "b",
  0: "",
  1: "#",
  2: "##",
};

/** Accidentals as they should be displayed (proper music glyphs). */
const ACCIDENTAL_GLYPHS: Record<number, string> = {
  [-2]: "♭♭",
  [-1]: "♭",
  0: "",
  1: "♯",
  2: "♯♯",
};

export function pitchClassOf(note: SpelledNote): number {
  return (((NATURAL_PITCH_CLASS[note.letter] + note.accidental) % 12) + 12) % 12;
}

/** ASCII form, e.g. "Bb". Used for parsing and tests. */
export function noteToAscii(note: SpelledNote): string {
  return note.letter + (ACCIDENTAL_NAMES[note.accidental] ?? "");
}

/** Display form, e.g. "B♭". */
export function noteToDisplay(note: SpelledNote): string {
  return note.letter + (ACCIDENTAL_GLYPHS[note.accidental] ?? "");
}

export function parseNote(name: string): SpelledNote {
  const match = /^([A-Ga-g])(bb|b|##|#|x)?$/.exec(name.trim());
  if (!match) throw new Error(`Not a note name: "${name}"`);
  const letter = match[1].toUpperCase() as Letter;
  const accidental =
    match[2] === "bb" ? -2 : match[2] === "b" ? -1 : match[2] === "#" ? 1 : match[2] === "##" || match[2] === "x" ? 2 : 0;
  return { letter, accidental };
}

/**
 * Spell the note `letterSteps` letters and `semitones` semitones above `root`.
 * Keeping the letter and the semitone distance independent is what makes a
 * diminished seventh spell as Bbb rather than A.
 */
export function spellAbove(root: SpelledNote, letterSteps: number, semitones: number): SpelledNote {
  const rootLetterIndex = LETTERS.indexOf(root.letter);
  const letter = LETTERS[(rootLetterIndex + letterSteps) % 7];
  const targetPitchClass = (pitchClassOf(root) + semitones) % 12;
  // Map the offset into -6..5 so a natural never comes back as a triple sharp.
  const accidental = (((targetPitchClass - NATURAL_PITCH_CLASS[letter] + 6) % 12) + 12) % 12 - 6;
  return { letter, accidental };
}

// --- MIDI ---

/** Middle C is MIDI 60. */
export const MIDDLE_C = 60;

export function pitchClassOfMidi(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

export function octaveOfMidi(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

export function isBlackKey(midi: number): boolean {
  return BLACK_PITCH_CLASSES.has(pitchClassOfMidi(midi));
}

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Neutral name for a piano key, e.g. "F#4". Chord tones get spelled properly elsewhere. */
export function midiToName(midi: number): string {
  return `${SHARP_NAMES[pitchClassOfMidi(midi)]}${octaveOfMidi(midi)}`;
}
