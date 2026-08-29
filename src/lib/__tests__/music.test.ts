import { describe, expect, it } from "vitest";
import {
  buildChord,
  chordAliasSymbols,
  chordSymbol,
  QUALITY_BY_ID,
  randomChord,
  chordId,
  findRootByAscii,
  parseChordId,
  ROOTS,
} from "../chords";
import { gradeAnswer } from "../grade";
import { midiToFrequency, noteToAscii, parseNote, pitchClassOf, spellAbove } from "../notes";
import { buildTwoFiveOne, randomTwoFiveOne } from "../progressions";
import { pickFromBag } from "../random";
import { buildScale, parseScaleId, randomScale, scaleId, scaleSymbol, SCALE_QUALITIES } from "../scales";
import { findStandard, MISTY, standardSteps } from "../standards";

const quality = (id: string) => {
  const q = QUALITY_BY_ID.get(id);
  if (!q) throw new Error(`missing quality ${id}`);
  return q;
};

const spelling = (root: string, id: string) => buildChord(parseNote(root), quality(id)).tones.map(noteToAscii);

/** Fails if any two consecutive entries in `sequence` are equal. */
function expectNoImmediateRepeats(sequence: readonly string[]): void {
  for (let i = 1; i < sequence.length; i++) {
    expect(sequence[i]).not.toBe(sequence[i - 1]);
  }
}

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

describe("midiToFrequency", () => {
  it("tunes A4 (MIDI 69) to 440Hz", () => {
    expect(midiToFrequency(69)).toBeCloseTo(440);
  });

  it("doubles frequency an octave up and halves it an octave down", () => {
    expect(midiToFrequency(81)).toBeCloseTo(880);
    expect(midiToFrequency(57)).toBeCloseTo(220);
  });

  it("tunes middle C (MIDI 60) to ~261.63Hz", () => {
    expect(midiToFrequency(60)).toBeCloseTo(261.63, 1);
  });
});

describe("symbols", () => {
  it("renders the root with a display accidental", () => {
    expect(chordSymbol(buildChord(parseNote("Bb"), quality("min7")))).toBe("B♭m7");
  });

  it("defaults to shape notation for major 7th and half-diminished chords", () => {
    expect(chordSymbol(buildChord(parseNote("D"), quality("maj7")))).toBe("D△7");
    expect(chordSymbol(buildChord(parseNote("E"), quality("min7b5")))).toBe("Eø7");
  });

  it("lists the traditional spelling as an alias of the shape notation", () => {
    expect(chordAliasSymbols(buildChord(parseNote("D"), quality("maj7")))).toEqual(["Dmaj7", "DM7"]);
    expect(chordAliasSymbols(buildChord(parseNote("E"), quality("min7b5")))).toEqual(["Em7♭5", "E-7♭5"]);
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
  it("draws every chord in the pool once before any repeat, starting fresh", () => {
    let used = new Set<string>();
    const ids = new Set<string>();
    for (let i = 0; i < ROOTS.length; i++) {
      const { chord, used: nextUsed } = randomChord(["maj7"], used);
      ids.add(chordId(chord));
      used = nextUsed;
    }
    expect(ids.size).toBe(ROOTS.length);
  });

  it("never repeats the immediately previous chord, even across a cycle boundary", () => {
    let used = new Set<string>();
    const ids: string[] = [];
    for (let i = 0; i < ROOTS.length * 5; i++) {
      const { chord, used: nextUsed } = randomChord(["maj7"], used);
      ids.push(chordId(chord));
      used = nextUsed;
    }
    expectNoImmediateRepeats(ids);
  });

  it("only draws from the enabled qualities", () => {
    let used = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const picked = randomChord(["dim7", "min7"], used);
      expect(picked.chord.quality.id).toMatch(/^(dim7|min7)$/);
      used = picked.used;
    }
  });
});

describe("buildTwoFiveOne", () => {
  it("builds Dm7 – G7 – C△7 in C", () => {
    const { chords } = buildTwoFiveOne(parseNote("C"));
    expect(chords.map(chordSymbol)).toEqual(["Dm7", "G7", "C△7"]);
  });

  it("spells a sharp key without mixing in flats", () => {
    const { chords } = buildTwoFiveOne(parseNote("F#"));
    expect(chords.map(chordSymbol)).toEqual(["G♯m7", "C♯7", "F♯△7"]);
  });

  it("spells a flat key without mixing in sharps", () => {
    const { chords } = buildTwoFiveOne(parseNote("Db"));
    expect(chords.map(chordSymbol)).toEqual(["E♭m7", "A♭7", "D♭△7"]);
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

describe("findRootByAscii", () => {
  it("finds every one of the fourteen practical roots by its ASCII spelling", () => {
    for (const root of ROOTS) {
      expect(findRootByAscii(noteToAscii(root))).toEqual(root);
    }
  });

  it("returns undefined for a spelling outside the practical set", () => {
    expect(findRootByAscii("B#")).toBeUndefined();
    expect(findRootByAscii("Fb")).toBeUndefined();
    expect(findRootByAscii("nonsense")).toBeUndefined();
  });
});

describe("parseChordId", () => {
  it("round-trips every root and quality through chordId()", () => {
    for (const root of ROOTS) {
      for (const q of QUALITY_BY_ID.values()) {
        const chord = buildChord(root, q);
        expect(parseChordId(chordId(chord))).toEqual(chord);
      }
    }
  });

  it("returns undefined for an unrecognized root or quality", () => {
    expect(parseChordId("H:maj7")).toBeUndefined();
    expect(parseChordId("C:not-a-quality")).toBeUndefined();
  });

  it("returns undefined for a malformed id", () => {
    expect(parseChordId("Cmaj7")).toBeUndefined();
    expect(parseChordId("")).toBeUndefined();
    expect(parseChordId(":maj7")).toBeUndefined();
    expect(parseChordId("C:")).toBeUndefined();
  });
});

describe("randomTwoFiveOne", () => {
  it("draws every key in the pool once before any repeat, starting fresh", () => {
    let used = new Set<string>();
    const ids = new Set<string>();
    for (let i = 0; i < ROOTS.length; i++) {
      const { progression, used: nextUsed } = randomTwoFiveOne(used);
      ids.add(noteToAscii(progression.key));
      used = nextUsed;
    }
    expect(ids.size).toBe(ROOTS.length);
  });

  it("never repeats the immediately previous key, even across a cycle boundary", () => {
    let used = new Set<string>();
    const ids: string[] = [];
    for (let i = 0; i < ROOTS.length * 5; i++) {
      const { progression, used: nextUsed } = randomTwoFiveOne(used);
      ids.push(noteToAscii(progression.key));
      used = nextUsed;
    }
    expectNoImmediateRepeats(ids);
  });
});

describe("standardSteps", () => {
  it("repeats the A section's chords once per A in the AABA form", () => {
    const steps = standardSteps(MISTY);
    const aChordCount = MISTY.sections.a.chart.length;
    const bridgeChordCount = MISTY.sections.bridge.chart.length;
    expect(steps.length).toBe(aChordCount * 3 + bridgeChordCount);

    const aSteps = steps.filter((step) => step.sectionLabel === "A");
    expect(aSteps.length).toBe(aChordCount * 3);
    expect(new Set(aSteps.map((step) => step.formIndex))).toEqual(new Set([1, 2, 4]));
  });

  it("plays the head in order, starting and ending on the tonic", () => {
    const steps = standardSteps(MISTY);
    expect(chordSymbol(steps[0].chord)).toBe("E♭△7");
    expect(chordSymbol(steps[steps.length - 1].chord)).toBe("B♭7");
    expect(steps[0].barIndex).toBe(1);
    expect(steps[0].formIndex).toBe(1);
  });

  it("numbers bars within each playing of a section starting at 1", () => {
    const steps = standardSteps(MISTY);
    const secondA = steps.filter((step) => step.sectionLabel === "A" && step.formIndex === 2);
    expect(secondA.map((step) => step.barIndex)).toEqual(MISTY.sections.a.chart.map((_, index) => index + 1));
  });
});

describe("findStandard", () => {
  it("finds Misty by id", () => {
    expect(findStandard("misty")).toBe(MISTY);
  });

  it("returns undefined for an unknown or null id", () => {
    expect(findStandard("not-a-standard")).toBeUndefined();
    expect(findStandard(null)).toBeUndefined();
  });
});

describe("diminished scales", () => {
  const scaleQuality = (id: string) => {
    const q = SCALE_QUALITIES.find((quality) => quality.id === id);
    if (!q) throw new Error(`missing scale quality ${id}`);
    return q;
  };

  it("spells the whole-half scale with the widely taught letters", () => {
    const scale = buildScale(parseNote("C"), scaleQuality("wholeHalf"));
    expect(scale.tones.map(noteToAscii)).toEqual(["C", "D", "Eb", "F", "Gb", "Ab", "A", "B"]);
    expect(scale.pitchClasses).toEqual([0, 2, 3, 5, 6, 8, 9, 11]);
  });

  it("spells the half-whole scale with the widely taught letters", () => {
    const scale = buildScale(parseNote("C"), scaleQuality("halfWhole"));
    expect(scale.tones.map(noteToAscii)).toEqual(["C", "Db", "D#", "E", "F#", "G", "A", "Bb"]);
    expect(scale.pitchClasses).toEqual([0, 1, 3, 4, 6, 7, 9, 10]);
  });

  it("renders the root with a display accidental", () => {
    expect(scaleSymbol(buildScale(parseNote("F#"), scaleQuality("halfWhole")))).toBe("F♯ dim (H–W)");
  });

  it("round-trips every root and quality through scaleId()", () => {
    for (const root of ROOTS) {
      for (const q of SCALE_QUALITIES) {
        const scale = buildScale(root, q);
        expect(parseScaleId(scaleId(scale))).toEqual(scale);
      }
    }
  });

  it("returns undefined for an unrecognized root, quality, or malformed id", () => {
    expect(parseScaleId("H:wholeHalf")).toBeUndefined();
    expect(parseScaleId("C:not-a-quality")).toBeUndefined();
    expect(parseScaleId("CwholeHalf")).toBeUndefined();
    expect(parseScaleId("")).toBeUndefined();
  });

  it("draws every scale in the pool once before any repeat, starting fresh", () => {
    let used = new Set<string>();
    const ids = new Set<string>();
    const poolSize = ROOTS.length * SCALE_QUALITIES.length;
    for (let i = 0; i < poolSize; i++) {
      const { scale, used: nextUsed } = randomScale(["wholeHalf", "halfWhole"], used);
      ids.add(scaleId(scale));
      used = nextUsed;
    }
    expect(ids.size).toBe(poolSize);
  });

  it("never repeats the immediately previous scale, even across a cycle boundary", () => {
    let used = new Set<string>();
    const ids: string[] = [];
    for (let i = 0; i < ROOTS.length * 5; i++) {
      const { scale, used: nextUsed } = randomScale(["wholeHalf"], used);
      ids.push(scaleId(scale));
      used = nextUsed;
    }
    expectNoImmediateRepeats(ids);
  });

  it("only draws from the enabled qualities", () => {
    let used = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const picked = randomScale(["halfWhole"], used);
      expect(picked.scale.quality.id).toBe("halfWhole");
      used = picked.used;
    }
  });
});

describe("pickFromBag", () => {
  it("draws every candidate once before any repeat, starting fresh", () => {
    const candidates = ["a", "b", "c", "d"];
    let used = new Set<string>();
    const values = new Set<string>();
    for (let i = 0; i < candidates.length; i++) {
      const picked = pickFromBag(candidates, (item) => item, used);
      values.add(picked.value);
      used = picked.used;
    }
    expect(values.size).toBe(candidates.length);
  });

  it("never repeats the immediately previous pick, even across a cycle boundary", () => {
    const candidates = ["a", "b", "c"];
    let used = new Set<string>();
    let previous: string | null = null;
    for (let i = 0; i < candidates.length * 20; i++) {
      const picked = pickFromBag(candidates, (item) => item, used);
      if (previous !== null) expect(picked.value).not.toBe(previous);
      previous = picked.value;
      used = picked.used;
    }
  });

  it("always returns the only candidate when there is just one", () => {
    let used = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const picked = pickFromBag(["only"], (item) => item, used);
      expect(picked.value).toBe("only");
      used = picked.used;
    }
  });

  it("throws with no candidates", () => {
    expect(() => pickFromBag([], (item: string) => item, new Set())).toThrow();
  });
});
