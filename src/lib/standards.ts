/** Jazz standards, expanded into the order the head is played. */

import { buildChord, findRootByAscii, QUALITY_BY_ID, type Chord } from "./chords";

/** One chord as it appears on the lead sheet: a root plus a quality id (see chords.ts). */
export interface ChartChord {
  /** ASCII root, e.g. "Eb" — see findRootByAscii(). */
  root: string;
  /** See CHORD_QUALITIES ids in chords.ts. */
  qualityId: string;
}

export interface StandardSection {
  /** Shown to the user, e.g. "A" or "Bridge". */
  label: string;
  chart: ChartChord[];
}

export interface JazzStandard {
  id: string;
  title: string;
  /** Display only, e.g. "E♭ major". */
  key: string;
  sections: Record<string, StandardSection>;
  /** Section keys in the order the head is played — an AABA form repeats "a" three times. */
  form: readonly string[];
}

export interface StandardStep {
  chord: Chord;
  sectionLabel: string;
  /** 1-based position of this chord within this playing of the section. */
  barIndex: number;
  /** 1-based position of this playing of the section within the form, e.g. the 2nd "A". */
  formIndex: number;
}

function resolveChord({ root, qualityId }: ChartChord): Chord {
  const spelled = findRootByAscii(root);
  const quality = QUALITY_BY_ID.get(qualityId);
  if (!spelled || !quality) throw new Error(`Unknown chord in standard chart: ${root}${qualityId}`);
  return buildChord(spelled, quality);
}

/** Expands a standard's form into the full head, in playing order. */
export function standardSteps(standard: JazzStandard): StandardStep[] {
  const steps: StandardStep[] = [];
  standard.form.forEach((sectionKey, formIndex) => {
    const section = standard.sections[sectionKey];
    if (!section) throw new Error(`Unknown section "${sectionKey}" in standard "${standard.id}"`);
    section.chart.forEach((chartChord, index) => {
      steps.push({
        chord: resolveChord(chartChord),
        sectionLabel: section.label,
        barIndex: index + 1,
        formIndex: formIndex + 1,
      });
    });
  });
  return steps;
}

// A simplified lead-sheet chart in E♭ major — one entry per chord change,
// not tied to a bar count, since this exercise only cares about the
// sequence of chords, not their duration.
export const MISTY: JazzStandard = {
  id: "misty",
  title: "Misty",
  key: "E♭ major",
  sections: {
    a: {
      label: "A",
      chart: [
        { root: "Eb", qualityId: "maj7" },
        { root: "Bb", qualityId: "min7" },
        { root: "Eb", qualityId: "dom7" },
        { root: "Ab", qualityId: "maj7" },
        { root: "Ab", qualityId: "min7" },
        { root: "Db", qualityId: "dom7" },
        { root: "Eb", qualityId: "maj7" },
        { root: "C", qualityId: "min7" },
        { root: "F", qualityId: "min7" },
        { root: "Bb", qualityId: "dom7" },
        { root: "Eb", qualityId: "maj7" },
        { root: "C", qualityId: "min7" },
        { root: "F", qualityId: "min7" },
        { root: "Bb", qualityId: "dom7" },
      ],
    },
    bridge: {
      label: "Bridge",
      chart: [
        { root: "Bb", qualityId: "min7" },
        { root: "Eb", qualityId: "dom7" },
        { root: "Ab", qualityId: "maj7" },
        { root: "Ab", qualityId: "maj7" },
        { root: "A", qualityId: "min7" },
        { root: "D", qualityId: "dom7" },
        { root: "G", qualityId: "maj7" },
        { root: "G", qualityId: "maj7" },
      ],
    },
  },
  form: ["a", "a", "bridge", "a"],
};

export const JAZZ_STANDARDS: JazzStandard[] = [MISTY];

export function findStandard(id: string | null): JazzStandard | undefined {
  return JAZZ_STANDARDS.find((standard) => standard.id === id);
}
