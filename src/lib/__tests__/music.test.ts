import { describe, expect, it } from "vitest";
import {
  ALTERED_CHORD_QUALITIES,
  alteredChordAliasSymbols,
  alteredChordId,
  alteredChordSymbol,
  buildAlteredChord,
  parseAlteredChordId,
  QUALITY_BY_ID as ALTERED_QUALITY_BY_ID,
  randomAlteredChord,
} from "../alteredChords";
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
import {
  buildMode,
  findModeQuality,
  gradeModeDegrees,
  MODE_QUALITIES,
  modeDegreeAlterations,
  modeDegreeMidiNotes,
  modeId,
  modeSymbol,
  parseModeId,
  randomMode,
  randomModeQuality,
} from "../modes";
import { pickFromBag } from "../random";
import {
  chordReplayGroups,
  chordReplayGroupsFromIntervals,
  intervalsToAscendingMidi,
  scaleReplayGroups,
  tonesToAscendingMidi,
} from "../replay";
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

describe("altered chords", () => {
  const alteredQuality = (id: string) => {
    const q = ALTERED_QUALITY_BY_ID.get(id);
    if (!q) throw new Error(`missing altered chord quality ${id}`);
    return q;
  };

  it("spells a dominant 9th chord", () => {
    const chord = buildAlteredChord(parseNote("C"), alteredQuality("dom9"));
    expect(chord.tones.map(noteToAscii)).toEqual(["C", "E", "G", "Bb", "D"]);
    expect(chord.pitchClasses).toEqual([0, 4, 7, 10, 2]);
  });

  it("keeps the 9th's real distance above the root more than an octave, unlike its mod-12 pitch class", () => {
    const dom9 = buildAlteredChord(parseNote("C"), alteredQuality("dom9"));
    expect(dom9.semitonesAboveRoot).toEqual([0, 4, 7, 10, 14]);
    expect(dom9.pitchClasses[4]).toBe(2); // for grading, the 9th and a 2nd are the same pitch class

    const dom13 = buildAlteredChord(parseNote("C"), alteredQuality("dom13"));
    expect(dom13.semitonesAboveRoot).toEqual([0, 4, 7, 10, 14, 21]);
  });

  it("spells the altered ninths with the correct accidental", () => {
    expect(buildAlteredChord(parseNote("C"), alteredQuality("dom7b9")).tones.map(noteToAscii)).toEqual([
      "C",
      "E",
      "G",
      "Bb",
      "Db",
    ]);
    expect(buildAlteredChord(parseNote("C"), alteredQuality("dom7sharp9")).tones.map(noteToAscii)).toEqual([
      "C",
      "E",
      "G",
      "Bb",
      "D#",
    ]);
  });

  it("spells a sharp 11 above the 7th", () => {
    expect(buildAlteredChord(parseNote("C"), alteredQuality("dom7sharp11")).tones.map(noteToAscii)).toEqual([
      "C",
      "E",
      "G",
      "Bb",
      "F#",
    ]);
  });

  it("spells dominant and major 13th chords with the 9th but not the 11th", () => {
    expect(buildAlteredChord(parseNote("C"), alteredQuality("dom13")).tones.map(noteToAscii)).toEqual([
      "C",
      "E",
      "G",
      "Bb",
      "D",
      "A",
    ]);
    expect(buildAlteredChord(parseNote("C"), alteredQuality("maj13")).tones.map(noteToAscii)).toEqual([
      "C",
      "E",
      "G",
      "B",
      "D",
      "A",
    ]);
  });

  it("spells minor 9th and 11th chords", () => {
    expect(buildAlteredChord(parseNote("C"), alteredQuality("min9")).tones.map(noteToAscii)).toEqual([
      "C",
      "Eb",
      "G",
      "Bb",
      "D",
    ]);
    expect(buildAlteredChord(parseNote("C"), alteredQuality("min11")).tones.map(noteToAscii)).toEqual([
      "C",
      "Eb",
      "G",
      "Bb",
      "F",
    ]);
  });

  it("renders the root with a display accidental", () => {
    expect(alteredChordSymbol(buildAlteredChord(parseNote("Bb"), alteredQuality("dom7b9")))).toBe("B♭7♭9");
    expect(alteredChordSymbol(buildAlteredChord(parseNote("D"), alteredQuality("maj9")))).toBe("D△9");
  });

  it("lists the plain-letter spelling as an alias of the shape notation", () => {
    expect(alteredChordAliasSymbols(buildAlteredChord(parseNote("D"), alteredQuality("maj9")))).toEqual([
      "Dmaj9",
      "DM9",
    ]);
  });

  it("grades a 13th chord, reporting the 9th and 13th as missing when left out", () => {
    const c13 = buildAlteredChord(parseNote("C"), alteredQuality("dom13"));
    const options = { requireRootInBass: false };
    expect(gradeAnswer(c13, [60, 64, 67, 70, 62, 69], options).correct).toBe(true);
    const grade = gradeAnswer(c13, [60, 64, 67, 70], options);
    expect(grade.correct).toBe(false);
    expect(grade.missingPitchClasses).toEqual([2, 9]);
  });

  it("round-trips every root and quality through alteredChordId()", () => {
    for (const root of ROOTS) {
      for (const q of ALTERED_CHORD_QUALITIES) {
        const chord = buildAlteredChord(root, q);
        expect(parseAlteredChordId(alteredChordId(chord))).toEqual(chord);
      }
    }
  });

  it("returns undefined for an unrecognized root, quality, or malformed id", () => {
    expect(parseAlteredChordId("H:dom9")).toBeUndefined();
    expect(parseAlteredChordId("C:not-a-quality")).toBeUndefined();
    expect(parseAlteredChordId("Cdom9")).toBeUndefined();
    expect(parseAlteredChordId("")).toBeUndefined();
  });

  it("draws every chord in the pool once before any repeat, starting fresh", () => {
    let used = new Set<string>();
    const ids = new Set<string>();
    for (let i = 0; i < ROOTS.length; i++) {
      const { chord, used: nextUsed } = randomAlteredChord(["dom9"], used);
      ids.add(alteredChordId(chord));
      used = nextUsed;
    }
    expect(ids.size).toBe(ROOTS.length);
  });

  it("never repeats the immediately previous chord, even across a cycle boundary", () => {
    let used = new Set<string>();
    const ids: string[] = [];
    for (let i = 0; i < ROOTS.length * 5; i++) {
      const { chord, used: nextUsed } = randomAlteredChord(["dom9"], used);
      ids.push(alteredChordId(chord));
      used = nextUsed;
    }
    expectNoImmediateRepeats(ids);
  });

  it("only draws from the enabled qualities", () => {
    let used = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const picked = randomAlteredChord(["min9", "min11"], used);
      expect(picked.chord.quality.id).toMatch(/^(min9|min11)$/);
      used = picked.used;
    }
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

describe("modes", () => {
  const modeQuality = (id: string) => {
    const q = MODE_QUALITIES.find((quality) => quality.id === id);
    if (!q) throw new Error(`missing mode quality ${id}`);
    return q;
  };

  it("spells every mode from C using only natural and single accidentals", () => {
    const spellingOf = (id: string) => buildMode(parseNote("C"), modeQuality(id)).tones.map(noteToAscii);
    expect(spellingOf("ionian")).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
    expect(spellingOf("dorian")).toEqual(["C", "D", "Eb", "F", "G", "A", "Bb"]);
    expect(spellingOf("phrygian")).toEqual(["C", "Db", "Eb", "F", "G", "Ab", "Bb"]);
    expect(spellingOf("lydian")).toEqual(["C", "D", "E", "F#", "G", "A", "B"]);
    expect(spellingOf("mixolydian")).toEqual(["C", "D", "E", "F", "G", "A", "Bb"]);
    expect(spellingOf("aeolian")).toEqual(["C", "D", "Eb", "F", "G", "Ab", "Bb"]);
    expect(spellingOf("locrian")).toEqual(["C", "Db", "Eb", "F", "Gb", "Ab", "Bb"]);
  });

  it("spells D Dorian on the white keys", () => {
    const mode = buildMode(parseNote("D"), modeQuality("dorian"));
    expect(mode.tones.map(noteToAscii)).toEqual(["D", "E", "F", "G", "A", "B", "C"]);
    expect(mode.pitchClasses).toEqual([2, 4, 5, 7, 9, 11, 0]);
  });

  it("renders the root with a display accidental", () => {
    expect(modeSymbol(buildMode(parseNote("Bb"), modeQuality("mixolydian")))).toBe("B♭ Mixolydian");
  });

  it("round-trips every root and quality through modeId()", () => {
    for (const root of ROOTS) {
      for (const q of MODE_QUALITIES) {
        const mode = buildMode(root, q);
        expect(parseModeId(modeId(mode))).toEqual(mode);
      }
    }
  });

  it("returns undefined for an unrecognized root, quality, or malformed id", () => {
    expect(parseModeId("H:dorian")).toBeUndefined();
    expect(parseModeId("C:not-a-mode")).toBeUndefined();
    expect(parseModeId("Cdorian")).toBeUndefined();
    expect(parseModeId("")).toBeUndefined();
  });

  it("draws every mode in the pool once before any repeat, starting fresh", () => {
    let used = new Set<string>();
    const ids = new Set<string>();
    const poolSize = ROOTS.length * MODE_QUALITIES.length;
    for (let i = 0; i < poolSize; i++) {
      const { mode, used: nextUsed } = randomMode(
        MODE_QUALITIES.map((q) => q.id),
        used,
      );
      ids.add(modeId(mode));
      used = nextUsed;
    }
    expect(ids.size).toBe(poolSize);
  });

  it("never repeats the immediately previous mode, even across a cycle boundary", () => {
    let used = new Set<string>();
    const ids: string[] = [];
    for (let i = 0; i < ROOTS.length * 5; i++) {
      const { mode, used: nextUsed } = randomMode(["dorian"], used);
      ids.push(modeId(mode));
      used = nextUsed;
    }
    expectNoImmediateRepeats(ids);
  });

  it("only draws from the enabled qualities", () => {
    let used = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const picked = randomMode(["locrian"], used);
      expect(picked.mode.quality.id).toBe("locrian");
      used = picked.used;
    }
  });
});

describe("modeDegreeAlterations", () => {
  const modeQuality = (id: string) => {
    const q = findModeQuality(id);
    if (!q) throw new Error(`missing mode quality ${id}`);
    return q;
  };

  it("finds nothing altered in Ionian", () => {
    expect(modeDegreeAlterations(modeQuality("ionian"))).toEqual([
      "natural",
      "natural",
      "natural",
      "natural",
      "natural",
      "natural",
      "natural",
    ]);
  });

  it("flattens the 3rd and 7th in Dorian", () => {
    expect(modeDegreeAlterations(modeQuality("dorian"))).toEqual([
      "natural",
      "natural",
      "flat",
      "natural",
      "natural",
      "natural",
      "flat",
    ]);
  });

  it("sharps only the 4th in Lydian", () => {
    expect(modeDegreeAlterations(modeQuality("lydian"))).toEqual([
      "natural",
      "natural",
      "natural",
      "sharp",
      "natural",
      "natural",
      "natural",
    ]);
  });

  it("flattens every degree but the 1st and 4th in Locrian", () => {
    expect(modeDegreeAlterations(modeQuality("locrian"))).toEqual([
      "natural",
      "flat",
      "flat",
      "natural",
      "flat",
      "flat",
      "flat",
    ]);
  });

  it("nests one more flat per mode going Ionian -> Mixolydian -> Dorian -> Aeolian -> Phrygian -> Locrian", () => {
    const flatsOf = (id: string) =>
      modeDegreeAlterations(modeQuality(id))
        .map((alteration, index) => (alteration === "flat" ? index + 1 : null))
        .filter((degree): degree is number => degree !== null);

    const order = ["ionian", "mixolydian", "dorian", "aeolian", "phrygian", "locrian"];
    let previous = flatsOf("ionian");
    expect(previous).toEqual([]);
    for (const id of order.slice(1)) {
      const flats = flatsOf(id);
      expect(flats.length).toBe(previous.length + 1);
      expect(flats).toEqual(expect.arrayContaining(previous));
      previous = flats;
    }
  });
});

describe("findModeQuality", () => {
  it("finds a mode quality by id", () => {
    expect(findModeQuality("phrygian")?.name).toBe("Phrygian");
  });

  it("returns undefined for an unrecognized id", () => {
    expect(findModeQuality("not-a-mode")).toBeUndefined();
  });
});

describe("modeDegreeMidiNotes", () => {
  const modeQuality = (id: string) => {
    const q = findModeQuality(id);
    if (!q) throw new Error(`missing mode quality ${id}`);
    return q;
  };

  it("places Dorian's seven degrees relative to middle C by default", () => {
    expect(modeDegreeMidiNotes(modeQuality("dorian"))).toEqual([60, 62, 63, 65, 67, 69, 70]);
  });

  it("shifts every degree by the same amount when given a different reference root", () => {
    expect(modeDegreeMidiNotes(modeQuality("dorian"), 67)).toEqual([67, 69, 70, 72, 74, 76, 77]);
  });

  it("agrees with modeDegreeAlterations' flats for Locrian", () => {
    // 1 b2 b3 4 b5 b6 b7 from C -> C Db Eb F Gb Ab Bb
    expect(modeDegreeMidiNotes(modeQuality("locrian"))).toEqual([60, 61, 63, 65, 66, 68, 70]);
  });
});

describe("gradeModeDegrees", () => {
  it("accepts the exact formula", () => {
    const dorian = findModeQuality("dorian")!;
    const answer = modeDegreeAlterations(dorian);
    const grade = gradeModeDegrees(dorian, answer);
    expect(grade.correct).toBe(true);
    expect(grade.correctDegrees).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(grade.wrongDegrees).toEqual([]);
  });

  it("reports which degrees are wrong and what they should be", () => {
    const dorian = findModeQuality("dorian")!;
    // All-natural answer: Dorian actually flattens the 3rd and 7th.
    const allNatural: Array<"flat" | "natural" | "sharp"> = Array(7).fill("natural");
    const grade = gradeModeDegrees(dorian, allNatural);
    expect(grade.correct).toBe(false);
    expect(grade.wrongDegrees).toEqual([
      { degree: 3, expected: "flat" },
      { degree: 7, expected: "flat" },
    ]);
    expect(grade.correctDegrees).toEqual([1, 2, 4, 5, 6]);
  });
});

describe("randomModeQuality", () => {
  it("draws every quality in the pool once before any repeat, starting fresh", () => {
    let used = new Set<string>();
    const ids = new Set<string>();
    for (let i = 0; i < MODE_QUALITIES.length; i++) {
      const { quality, used: nextUsed } = randomModeQuality(
        MODE_QUALITIES.map((q) => q.id),
        used,
      );
      ids.add(quality.id);
      used = nextUsed;
    }
    expect(ids.size).toBe(MODE_QUALITIES.length);
  });

  it("never repeats the immediately previous quality, even across a cycle boundary", () => {
    let used = new Set<string>();
    const ids: string[] = [];
    const allIds = MODE_QUALITIES.map((q) => q.id);
    for (let i = 0; i < MODE_QUALITIES.length * 5; i++) {
      const { quality, used: nextUsed } = randomModeQuality(allIds, used);
      ids.push(quality.id);
      used = nextUsed;
    }
    expectNoImmediateRepeats(ids);
  });

  it("only draws from the enabled qualities", () => {
    let used = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const picked = randomModeQuality(["locrian"], used);
      expect(picked.quality.id).toBe("locrian");
      used = picked.used;
    }
  });

  it("throws with no qualities enabled", () => {
    expect(() => randomModeQuality([])).toThrow();
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

describe("tonesToAscendingMidi", () => {
  it("places the root at its pitch class in the octave starting at lowMidi", () => {
    const chord = buildChord(parseNote("C"), quality("maj7"));
    expect(tonesToAscendingMidi(chord.tones, 48)).toEqual([48, 52, 55, 59]);
  });

  it("keeps the root at or above lowMidi even when its pitch class isn't 0", () => {
    const chord = buildChord(parseNote("Bb"), quality("min7"));
    expect(tonesToAscendingMidi(chord.tones, 48)).toEqual([58, 61, 65, 68]);
  });

  it("keeps every tone strictly ascending and within a major 7th of the root, for every chord", () => {
    for (const root of ROOTS) {
      for (const q of QUALITY_BY_ID.values()) {
        const midi = tonesToAscendingMidi(buildChord(root, q).tones, 48);
        expect(midi[0]).toBeGreaterThanOrEqual(48);
        expect(midi[midi.length - 1] - midi[0]).toBeLessThanOrEqual(11);
        for (let i = 1; i < midi.length; i++) expect(midi[i]).toBeGreaterThan(midi[i - 1]);
      }
    }
  });

  it("keeps every tone strictly ascending and within a major 7th of the root, for every scale", () => {
    for (const root of ROOTS) {
      for (const q of SCALE_QUALITIES) {
        const midi = tonesToAscendingMidi(buildScale(root, q).tones, 48);
        expect(midi[0]).toBeGreaterThanOrEqual(48);
        expect(midi[midi.length - 1] - midi[0]).toBeLessThanOrEqual(11);
        for (let i = 1; i < midi.length; i++) expect(midi[i]).toBeGreaterThan(midi[i - 1]);
      }
    }
  });
});

describe("scaleReplayGroups", () => {
  it("strikes each tone alone, in ascending order", () => {
    const scaleQuality = SCALE_QUALITIES.find((q) => q.id === "wholeHalf")!;
    const scale = buildScale(parseNote("C"), scaleQuality);
    expect(scaleReplayGroups(scale.tones, 48)).toEqual([[48], [50], [51], [53], [54], [56], [57], [59]]);
  });
});

describe("chordReplayGroups", () => {
  it("strikes each tone alone, in ascending order, then every tone together as a block", () => {
    const chord = buildChord(parseNote("C"), quality("maj7"));
    expect(chordReplayGroups(chord.tones, 48)).toEqual([[48], [52], [55], [59], [48, 52, 55, 59]]);
  });
});

describe("intervalsToAscendingMidi", () => {
  const alteredQuality = (id: string) => {
    const q = ALTERED_QUALITY_BY_ID.get(id);
    if (!q) throw new Error(`missing altered chord quality ${id}`);
    return q;
  };

  it("places a 9th more than an octave above the root, unlike tonesToAscendingMidi's mod-12 folding", () => {
    const dom9 = buildAlteredChord(parseNote("C"), alteredQuality("dom9"));
    expect(intervalsToAscendingMidi(dom9.root, dom9.semitonesAboveRoot, 48)).toEqual([48, 52, 55, 58, 62]);

    // Feeding the same tones through the plain (pitch-class-only) helper
    // would fold the 9th right back down next to the root instead — the
    // bug this function exists to avoid.
    expect(tonesToAscendingMidi(dom9.tones, 48)).toEqual([48, 52, 55, 58, 50]);
  });

  it("keeps a dominant 13th chord strictly ascending — 9th above the 7th, 13th above the 9th", () => {
    const dom13 = buildAlteredChord(parseNote("C"), alteredQuality("dom13"));
    const midi = intervalsToAscendingMidi(dom13.root, dom13.semitonesAboveRoot, 48);
    expect(midi).toEqual([48, 52, 55, 58, 62, 69]);
    for (let i = 1; i < midi.length; i++) expect(midi[i]).toBeGreaterThan(midi[i - 1]);
  });
});

describe("chordReplayGroupsFromIntervals", () => {
  it("strikes each tone alone, in true ascending order, then every tone together as a block", () => {
    const dom9Quality = ALTERED_QUALITY_BY_ID.get("dom9");
    if (!dom9Quality) throw new Error("missing altered chord quality dom9");
    const dom9 = buildAlteredChord(parseNote("C"), dom9Quality);
    expect(chordReplayGroupsFromIntervals(dom9.root, dom9.semitonesAboveRoot, 48)).toEqual([
      [48],
      [52],
      [55],
      [58],
      [62],
      [48, 52, 55, 58, 62],
    ]);
  });
});
