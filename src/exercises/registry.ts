import type { ComponentType } from "react";
import { SeventhChordExercise } from "./seventh-chords/SeventhChordExercise";
import { TwoFiveOneExercise } from "./two-five-one/TwoFiveOneExercise";

export interface ExerciseDefinition {
  id: string;
  title: string;
  summary: string;
  /** Exercises without a component are stubs listed on the home screen. */
  component?: ComponentType;
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
  },
];

export function findExercise(id: string | null): ExerciseDefinition | undefined {
  return EXERCISES.find((exercise) => exercise.id === id);
}
