import type { ComponentType } from "react";
import { DiminishedScaleExercise } from "./diminished-scale/DiminishedScaleExercise";
import { JazzStandardExercise } from "./jazz-standards/JazzStandardExercise";
import { ModesExercise } from "./modes/ModesExercise";
import { SeventhChordExercise } from "./seventh-chords/SeventhChordExercise";
import { TwoFiveOneExercise } from "./two-five-one/TwoFiveOneExercise";
import type { ExerciseComponentProps } from "./types";

export interface ExerciseDefinition {
  id: string;
  title: string;
  summary: string;
  /** Exercises without a component are stubs listed on the home screen. */
  component?: ComponentType<ExerciseComponentProps>;
  /**
   * Jazz standards get their own section on the home screen, rendered from
   * `JAZZ_STANDARDS` directly instead of this entry's own card — see Home()
   * in App.tsx. This entry only exists so hash routing has a component to
   * dispatch "jazz-standards" to.
   */
  category?: "standard";
}

export const EXERCISES: ExerciseDefinition[] = [
  {
    id: "seventh-chords",
    title: "7th Chords",
    summary: "Read a jazz chord symbol and build the chord on the keyboard.",
    component: SeventhChordExercise,
  },
  {
    id: "two-five-one",
    title: "ii–V–I",
    summary: "See the key, then play the ii, V, and I chords in order.",
    component: TwoFiveOneExercise,
  },
  {
    id: "diminished-scale",
    title: "Diminished Scales",
    summary: "Play the whole-half or half-whole diminished scale from any root.",
    component: DiminishedScaleExercise,
  },
  {
    id: "intervals",
    title: "Intervals",
    summary: "Identify and build intervals from a given starting note.",
  },
  {
    id: "key-signatures",
    title: "Key Signatures",
    summary: "Name the sharps and flats for any major or minor key.",
  },
  {
    id: "modes",
    title: "Modes",
    summary: "Play the seven modes from any tonic.",
    component: ModesExercise,
  },
  {
    id: "jazz-standards",
    title: "Jazz Standards",
    summary: "Play the changes to a jazz standard in the order the head is played.",
    component: JazzStandardExercise,
    category: "standard",
  },
];

export function findExercise(id: string | null): ExerciseDefinition | undefined {
  return EXERCISES.find((exercise) => exercise.id === id);
}
