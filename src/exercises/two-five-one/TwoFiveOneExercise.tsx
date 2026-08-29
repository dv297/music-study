import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Piano, type KeyMark } from "../../components/Piano";
import { useStoredState } from "../../hooks/useStoredState";
import { chordSymbol, chordToneNames, findRootByAscii, type Chord } from "../../lib/chords";
import { gradeAnswer, type Grade } from "../../lib/grade";
import { noteToAscii, pitchClassOfMidi } from "../../lib/notes";
import { buildTwoFiveOne, DEGREES, randomTwoFiveOne, type Degree, type TwoFiveOne } from "../../lib/progressions";
import type { ExerciseComponentProps } from "../types";

const LOW_MIDI = 48; // C3
const HIGH_MIDI = 72; // C5
const SETTINGS_PREFIX = "music-study:two-five-one:";
const LAST_STEP = DEGREES.length - 1;

type StepGrades = readonly [Grade | null, Grade | null, Grade | null];
const NO_GRADES: StepGrades = [null, null, null];

interface Stats {
  attempted: number;
  correct: number;
  streak: number;
  bestStreak: number;
}

const EMPTY_STATS: Stats = { attempted: 0, correct: 0, streak: 0, bestStreak: 0 };

export function TwoFiveOneExercise({ params }: ExerciseComponentProps) {
  const [requireRootInBass, setRequireRootInBass] = useStoredState(`${SETTINGS_PREFIX}requireRootInBass`, false);
  const [showNoteNames, setShowNoteNames] = useStoredState(`${SETTINGS_PREFIX}showNoteNames`, false);
  const [autoSubmit, setAutoSubmit] = useStoredState(`${SETTINGS_PREFIX}autoSubmit`, false);

  // A ?key=Bb param pins the opening progression instead of drawing a
  // random one, so a Playwright test can land on a known ii–V–I.
  const forcedKey = useMemo(() => {
    const raw = params.get("key");
    return raw ? findRootByAscii(raw.trim()) : undefined;
  }, [params]);

  // Tracks which keys this cycle has already drawn so nextProgression()
  // avoids repeating one until the rest of the pool has come up.
  const usedKeysRef = useRef<Set<string>>(new Set());
  const [progression, setProgression] = useState<TwoFiveOne>(() => {
    if (forcedKey) {
      usedKeysRef.current = new Set([noteToAscii(forcedKey)]);
      return buildTwoFiveOne(forcedKey);
    }
    const picked = randomTwoFiveOne();
    usedKeysRef.current = picked.used;
    return picked.progression;
  });
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set<number>());
  const [grades, setGrades] = useState<StepGrades>(NO_GRADES);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);

  const degree = DEGREES[step];
  const chord = progression.chords[step];
  const grade = grades[step];
  const onLastStep = step === LAST_STEP;
  const progressionDone = onLastStep && grade !== null;
  const wholeCorrect = progressionDone && grades.every((g) => g?.correct);

  const nextProgression = useCallback(() => {
    const picked = randomTwoFiveOne(usedKeysRef.current);
    usedKeysRef.current = picked.used;
    setProgression(picked.progression);
    setStep(0);
    setSelected(new Set<number>());
    setGrades(NO_GRADES);
  }, []);

  const advance = useCallback(() => {
    setStep((previous) => (previous < LAST_STEP ? previous + 1 : previous));
    setSelected(new Set<number>());
  }, []);

  const toggleKey = useCallback((midi: number) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(midi)) next.delete(midi);
      else next.add(midi);
      return next;
    });
  }, []);

  const submit = useCallback(() => {
    if (grade || selected.size === 0) return;
    const result = gradeAnswer(chord, [...selected], { requireRootInBass });
    setGrades((previous) => {
      const next: [Grade | null, Grade | null, Grade | null] = [previous[0], previous[1], previous[2]];
      next[step] = result;
      return next;
    });
    if (onLastStep) {
      const allCorrect = Boolean(grades[0]?.correct) && Boolean(grades[1]?.correct) && result.correct;
      setStats((previous) => {
        const streak = allCorrect ? previous.streak + 1 : 0;
        return {
          attempted: previous.attempted + 1,
          correct: previous.correct + (allCorrect ? 1 : 0),
          streak,
          bestStreak: Math.max(previous.bestStreak, streak),
        };
      });
    }
  }, [chord, grade, grades, onLastStep, requireRootInBass, selected, step]);

  const clear = useCallback(() => {
    if (grade) return;
    setSelected(new Set<number>());
  }, [grade]);

  // Auto-submit once the selection has as many notes as the chord needs.
  useEffect(() => {
    if (autoSubmit && !grade && selected.size >= chord.pitchClasses.length) submit();
  }, [autoSubmit, chord, grade, selected, submit]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter") {
        event.preventDefault();
        if (!grade) submit();
        else if (progressionDone) nextProgression();
        else advance();
      } else if (event.key === "Escape" || event.key === "Backspace") {
        event.preventDefault();
        clear();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [advance, clear, grade, nextProgression, progressionDone, submit]);

  const marks = useMemo(() => {
    const result = new Map<number, KeyMark>();
    if (!grade) return result;
    for (const midi of grade.correctMidi) result.set(midi, "correct");
    for (const midi of grade.extraMidi) result.set(midi, "extra");
    const missing = new Set(grade.missingPitchClasses);
    for (let midi = LOW_MIDI; midi <= HIGH_MIDI; midi++) {
      if (missing.has(pitchClassOfMidi(midi)) && !result.has(midi)) result.set(midi, "missing");
    }
    return result;
  }, [grade]);

  const tonic = progression.chords[2];
  const accuracy = stats.attempted === 0 ? null : Math.round((stats.correct / stats.attempted) * 100);

  return (
    <div className="exercise">
      <header className="prompt">
        <p className="prompt-instruction">Resolving to</p>
        <p className="chord-symbol">{chordSymbol(tonic)}</p>
      </header>

      <ol className="progression-steps">
        {DEGREES.map((label, index) => (
          <li key={label} className={stepClassName(index, step, grades)} aria-current={index === step ? "step" : undefined}>
            {label}
          </li>
        ))}
      </ol>

      <div className={`verdict verdict-${verdictState(grade, progressionDone, wholeCorrect)}`}>
        {grade ? (
          <Feedback degree={degree} chord={chord} grade={grade} summary={progressionDone ? summarize(grades) : null} />
        ) : (
          <p>{stepInstruction(degree, selected.size, requireRootInBass)}</p>
        )}
      </div>

      <Piano
        lowMidi={LOW_MIDI}
        highMidi={HIGH_MIDI}
        selected={selected}
        onToggle={toggleKey}
        marks={marks}
        showNoteNames={showNoteNames}
        disabled={Boolean(grade)}
      />

      <div className="actions">
        {grade ? (
          <button
            type="button"
            className="button button-primary"
            onClick={progressionDone ? nextProgression : advance}
            autoFocus
          >
            {progressionDone ? "New ii–V–I" : `Next: ${DEGREES[step + 1]}`} <kbd>↵</kbd>
          </button>
        ) : (
          <>
            <button type="button" className="button button-primary" onClick={submit} disabled={selected.size === 0}>
              Check <kbd>↵</kbd>
            </button>
            <button type="button" className="button" onClick={clear} disabled={selected.size === 0}>
              Clear <kbd>esc</kbd>
            </button>
          </>
        )}
      </div>

      <dl className="scoreboard">
        <div>
          <dt>Correct</dt>
          <dd>
            {stats.correct}/{stats.attempted}
            {accuracy !== null && <span className="scoreboard-sub"> ({accuracy}%)</span>}
          </dd>
        </div>
        <div>
          <dt>Streak</dt>
          <dd>{stats.streak}</dd>
        </div>
        <div>
          <dt>Best streak</dt>
          <dd>{stats.bestStreak}</dd>
        </div>
      </dl>

      <Settings
        requireRootInBass={requireRootInBass}
        onRequireRootInBassChange={setRequireRootInBass}
        showNoteNames={showNoteNames}
        onShowNoteNamesChange={setShowNoteNames}
        autoSubmit={autoSubmit}
        onAutoSubmitChange={setAutoSubmit}
        onReset={() => setStats(EMPTY_STATS)}
      />
    </div>
  );
}

function verdictState(grade: Grade | null, progressionDone: boolean, wholeCorrect: boolean): "pending" | "correct" | "incorrect" {
  if (!grade) return "pending";
  if (progressionDone) return wholeCorrect ? "correct" : "incorrect";
  return grade.correct ? "correct" : "incorrect";
}

function stepClassName(index: number, currentStep: number, grades: StepGrades): string {
  const gradeAtIndex = grades[index];
  const classes = [
    "progression-step",
    index === currentStep ? "is-current" : index > currentStep ? "is-upcoming" : "",
    gradeAtIndex ? (gradeAtIndex.correct ? "is-correct" : "is-incorrect") : "",
  ];
  return classes.filter(Boolean).join(" ");
}

function stepInstruction(degree: Degree, count: number, requireRootInBass: boolean): string {
  if (count === 0) {
    return requireRootInBass ? `Play the ${degree} chord — root in the bass.` : `Play the ${degree} chord.`;
  }
  return `${count} ${count === 1 ? "key" : "keys"} held.`;
}

function summarize(grades: StepGrades): string {
  const correctCount = grades.filter((g) => g?.correct).length;
  return correctCount === DEGREES.length ? "Clean ii–V–I." : `${correctCount} of ${DEGREES.length} correct.`;
}

function Feedback({ degree, chord, grade, summary }: { degree: Degree; chord: Chord; grade: Grade; summary: string | null }) {
  const tones = chordToneNames(chord).join(" · ");
  const symbol = chordSymbol(chord);

  let body: React.ReactNode;
  if (grade.correct) {
    body = (
      <p>
        <strong>Correct.</strong> {degree} is {symbol} — {tones}.
      </p>
    );
  } else if (grade.voicingIssue) {
    body = (
      <p>
        <strong>Almost.</strong> {grade.voicingIssue}
      </p>
    );
  } else {
    const problems: string[] = [];
    if (grade.missingPitchClasses.length > 0) {
      problems.push(`missed ${grade.missingPitchClasses.length} ${grade.missingPitchClasses.length === 1 ? "note" : "notes"}`);
    }
    if (grade.extraMidi.length > 0) {
      const verb = grade.extraMidi.length === 1 ? "doesn't" : "don't";
      problems.push(`${grade.extraMidi.length} that ${verb} belong`);
    }
    body = (
      <p>
        <strong>Not quite</strong>
        {problems.length > 0 && ` — ${problems.join(", ")}`}. {degree} is {symbol} — {tones} ({chord.quality.formula}).
      </p>
    );
  }

  return (
    <div>
      {body}
      {summary && <p className="progression-summary">{summary}</p>}
    </div>
  );
}

interface SettingsProps {
  requireRootInBass: boolean;
  onRequireRootInBassChange: (value: boolean) => void;
  showNoteNames: boolean;
  onShowNoteNamesChange: (value: boolean) => void;
  autoSubmit: boolean;
  onAutoSubmitChange: (value: boolean) => void;
  onReset: () => void;
}

function Settings({
  requireRootInBass,
  onRequireRootInBassChange,
  showNoteNames,
  onShowNoteNamesChange,
  autoSubmit,
  onAutoSubmitChange,
  onReset,
}: SettingsProps) {
  return (
    <details className="settings">
      <summary>Settings</summary>
      <div className="settings-body">
        <fieldset>
          <legend>Options</legend>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={requireRootInBass}
              onChange={(event) => onRequireRootInBassChange(event.target.checked)}
            />
            <span>Require the root in the bass (no inversions)</span>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={showNoteNames}
              onChange={(event) => onShowNoteNamesChange(event.target.checked)}
            />
            <span>Show note names on the keys</span>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={autoSubmit}
              onChange={(event) => onAutoSubmitChange(event.target.checked)}
            />
            <span>Check automatically once enough notes are selected</span>
          </label>
        </fieldset>

        <button type="button" className="button button-quiet" onClick={onReset}>
          Reset score
        </button>
      </div>
    </details>
  );
}
