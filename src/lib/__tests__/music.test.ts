import { describe, expect, it } from "vitest";
import { buildChord, chordSymbol, QUALITY_BY_ID, randomChord, chordId, ROOTS } from "../chords";
import { gradeAnswer } from "../grade";
import { noteToAscii, parseNote, pitchClassOf, spellAbove } from "../notes";
import { buildTwoFiveOne, randomTwoFiveOne } from "../progressions";

const quality = (id: string) => {
  const q = QUALITY_BY_ID.get(id);
  if (!q) throw new Error(`missing quality ${id}`);
  return q;
};

const spelling = (root: string, id: string) =>
  buildChord(parseNote(root), quality(id)).tones.map(noteToAscii);

describe("spelling", () => {
  it("keeps letters distinct in a diminished seventh", () => {
    expect(spelling("C", "dim7")).toEqual(["C", "Eb", "Gb", "Bbb"]);
  });

  it("spells sharp roots without mixing in flats", () => {
    expect(spelling("F#", "maj7")).toEqual(["F#", "A#", "C#", "E#"]);
  });

  it("spells flat roots without mixing in sharps", () => {
    expect(spelling("Db", "dom7")).toEqual(["Db", "F", "Ab", "Cb"]);
  });

  it("handles double flats from a flat root", () => {
    expect(spelling("Eb", "min7b5")).toEqual(["Eb", "Gb", "Bbb", "Db"]);
  });

  it("raises the fifth rather than flattening the sixth", () => {
    expect(spelling("C", "dom7sharp5")).toEqual(["C", "E", "G#", "Bb"]);
  });

  it("wraps letters past B", () => {
    expect(noteToAscii(spellAbove(parseNote("B"), 2, 4))).toBe("D#");
  });
});

describe("symbols", () => {
  it("renders the root with a display accidental", () => {
    expect(chordSymbol(buildChord(parseNote("Bb"), quality("min7")))).toBe("B♭m7");
  });
});

describe("grading", () => {
  const cmaj7 = buildChord(parseNote("C"), quality("maj7"));
  const options = { requireRootInBass: false };

  it("accepts the chord in close position", () => {
    expect(gradeAnswer(cmaj7, [60, 64, 67, 71], options).correct).toBe(true);
  });

  it("accepts any inversion or octave when the bass is not constrained", () => {
    expect(gradeAnswer(cmaj7, [64, 67, 71, 72], options).correct).toBe(true);
  });

  it("reports a missing seventh", () => {
    const grade = gradeAnswer(cmaj7, [60, 64, 67], options);
    expect(grade.correct).toBe(false);
    expect(grade.missingPitchClasses).toEqual([11]);
  });

  it("reports a wrong note as extra", () => {
    const grade = gradeAnswer(cmaj7, [60, 64, 67, 70], options);
    expect(grade.extraMidi).toEqual([70]);
    expect(grade.missingPitchClasses).toEqual([11]);
  });

  it("accepts doubled chord tones", () => {
    expect(gradeAnswer(cmaj7, [60, 64, 67, 71, 72], options).correct).toBe(true);
  });

  it("rejects an inversion when the root is required in the bass", () => {
    const grade = gradeAnswer(cmaj7, [64, 67, 71, 72], { requireRootInBass: true });
    expect(grade.correct).toBe(false);
    expect(grade.voicingIssue).toContain("C");
  });

  it("accepts root position when the root is required in the bass", () => {
    expect(gradeAnswer(cmaj7, [60, 64, 67, 71], { requireRootInBass: true }).correct).toBe(true);
  });
});

describe("randomChord", () => {
  it("never repeats the previous chord", () => {
    const previous = buildChord(parseNote("C"), quality("maj7"));
    for (let i = 0; i < 200; i++) {
      expect(chordId(randomChord(["maj7"], previous))).not.toBe(chordId(previous));
    }
  });

  it("only draws from the enabled qualities", () => {
    for (let i = 0; i < 50; i++) {
      expect(randomChord(["dim7", "min7"]).quality.id).toMatch(/^(dim7|min7)$/);
    }
  });
});

describe("buildTwoFiveOne", () => {
  it("builds Dm7 – G7 – Cmaj7 in C", () => {
    const { chords } = buildTwoFiveOne(parseNote("C"));
    expect(chords.map(chordSymbol)).toEqual(["Dm7", "G7", "Cmaj7"]);
  });

  it("spells a sharp key without mixing in flats", () => {
    const { chords } = buildTwoFiveOne(parseNote("F#"));
    expect(chords.map(chordSymbol)).toEqual(["G♯m7", "C♯7", "F♯maj7"]);
  });

  it("spells a flat key without mixing in sharps", () => {
    const { chords } = buildTwoFiveOne(parseNote("Db"));
    expect(chords.map(chordSymbol)).toEqual(["E♭m7", "A♭7", "D♭maj7"]);
  });

  it("puts ii a major 2nd and V a perfect 5th above the key, for every practical root", () => {
    for (const root of ROOTS) {
      const { chords } = buildTwoFiveOne(root);
      const keyPitchClass = pitchClassOf(root);
      expect(pitchClassOf(chords[0].root)).toBe((keyPitchClass + 2) % 12);
      expect(pitchClassOf(chords[1].root)).toBe((keyPitchClass + 7) % 12);
      expect(pitchClassOf(chords[2].root)).toBe(keyPitchClass);
    }
  });

  it("always uses minor 7th, dominant 7th, and major 7th qualities", () => {
    for (const root of ROOTS) {
      const { chords } = buildTwoFiveOne(root);
      expect(chords.map((chord) => chord.quality.id)).toEqual(["min7", "dom7", "maj7"]);
    }
  });
});

describe("randomTwoFiveOne", () => {
  it("never repeats the previous key", () => {
    let previous = buildTwoFiveOne(parseNote("C"));
    for (let i = 0; i < 200; i++) {
      const next = randomTwoFiveOne(previous);
      expect(noteToAscii(next.key)).not.toBe(noteToAscii(previous.key));
      previous = next;
    }
  });
});
