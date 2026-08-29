import { useCallback, useEffect, useMemo, useState } from "react";
import { Piano, type KeyMark } from "../../components/Piano";
import { useStoredState } from "../../hooks/useStoredState";
import { chordSymbol, chordToneNames, type Chord } from "../../lib/chords";
import { gradeAnswer, type Grade } from "../../lib/grade";
import { pitchClassOfMidi } from "../../lib/notes";
import { JAZZ_STANDARDS, findStandard, standardSteps, type JazzStandard, type StandardStep } from "../../lib/standards";
import type { ExerciseComponentProps } from "../types";

const LOW_MIDI = 48; // C3
const HIGH_MIDI = 72; // C5
const SETTINGS_PREFIX = "music-study:jazz-standards:";

interface Stats {
  correct: number;
  attempted: number;
}

const EMPTY_STATS: Stats = { correct: 0, attempted: 0 };

export function JazzStandardExercise({ params }: ExerciseComponentProps) {
  const standard = findStandard(params.get("standard"));
  if (!standard) return <StandardPicker />;
  return <StandardPractice standard={standard} params={params} />;
}

function StandardPicker() {
  return (
    <div className="standard-picker">
      <p>Pick a jazz standard to practice.</p>
      <ul className="exercise-list">
        {JAZZ_STANDARDS.map((standard) => (
          <li key={standard.id}>
            <a className="exercise-card" href={`#/exercise/jazz-standards?standard=${standard.id}`}>
              <h2>{standard.title}</h2>
              <p>{standard.key}</p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StandardPractice({ standard, params }: { standard: JazzStandard; params: URLSearchParams }) {
  const [requireRootInBass, setRequireRootInBass] = useStoredState(`${SETTINGS_PREFIX}requireRootInBass`, false);
  const [showNoteNames, setShowNoteNames] = useStoredState(`${SETTINGS_PREFIX}showNoteNames`, false);
  const [autoSubmit, setAutoSubmit] = useStoredState(`${SETTINGS_PREFIX}autoSubmit`, false);
  const [playSound, setPlaySound] = useStoredState(`${SETTINGS_PREFIX}playSound`, true);

  const steps = useMemo(() => standardSteps(standard), [standard]);
  const lastStep = steps.length - 1;

  // A ?step= param pins the opening chord instead of starting from the top,
  // so a Playwright test can land on a known chord partway through the tune.
  const forcedStep = useMemo(() => {
    const raw = params.get("step");
    if (raw === null) return undefined;
    const parsed = Number.parseInt(raw, 10);
    return Number.isInteger(parsed) && parsed >= 0 && parsed <= lastStep ? parsed : undefined;
  }, [params, lastStep]);

  const [stepIndex, setStepIndex] = useState(forcedStep ?? 0);
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set<number>());
  const [grade, setGrade] = useState<Grade | null>(null);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);

  const step = steps[stepIndex];
  const chord = step.chord;
  const onLastStep = stepIndex === lastStep;
  const tuneDone = onLastStep && grade !== null;

  const restart = useCallback(() => {
    setStepIndex(0);
    setSelected(new Set<number>());
    setGrade(null);
    setStats(EMPTY_STATS);
  }, []);

  const advance = useCallback(() => {
    setStepIndex((previous) => (previous < lastStep ? previous + 1 : previous));
    setSelected(new Set<number>());
    setGrade(null);
  }, [lastStep]);

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
    setGrade(result);
    setStats((previous) => ({
      attempted: previous.attempted + 1,
      correct: previous.correct + (result.correct ? 1 : 0),
    }));
  }, [chord, grade, requireRootInBass, selected]);

  const clear = useCallback(() => {
    if (grade) return;
    setSelected(new Set<number>());
  }, [grade]);

  const retry = useCallback(() => {
    setSelected(new Set<number>());
    setGrade(null);
  }, []);

  // Auto-submit once the selection has as many notes as the chord needs.
  // Deliberately an effect rather than a call inside toggleKey — see the
  // same pattern in SeventhChordExercise.tsx.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoSubmit && !grade && selected.size >= chord.pitchClasses.length) submit();
  }, [autoSubmit, chord, grade, selected, submit]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter") {
        event.preventDefault();
        if (!grade) submit();
        else if (tuneDone) restart();
        else advance();
      } else if (event.key === "Escape" || event.key === "Backspace") {
        event.preventDefault();
        clear();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [advance, clear, grade, restart, submit, tuneDone]);

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

  const done = stepIndex + (grade ? 1 : 0);
  const remaining = steps.length - done;
  const accuracy = stats.attempted === 0 ? null : Math.round((stats.correct / stats.attempted) * 100);

  return (
    <div className="exercise">
      <header className="prompt">
        <p className="prompt-instruction">
          {standard.title} — {sectionName(step, standard)}
        </p>
        <p className="chord-symbol">{chordSymbol(chord)}</p>
      </header>

      <div className="standard-progress">
        <div className="standard-progress-bar">
          <div className="standard-progress-fill" style={{ width: `${(done / steps.length) * 100}%` }} />
        </div>
        <p className="standard-progress-label">
          Chord {stepIndex + 1} of {steps.length} · {remaining} to go
        </p>
      </div>

      <div className={`verdict verdict-${grade ? (grade.correct ? "correct" : "incorrect") : "pending"}`}>
        {grade ? (
          <Feedback chord={chord} grade={grade} tuneDone={tuneDone} stats={stats} />
        ) : (
          <p>{describeSelection(selected.size, requireRootInBass)}</p>
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
        playSound={playSound}
      />

      <div className="actions">
        {grade ? (
          <>
            {!grade.correct && (
              <button type="button" className="button" onClick={retry}>
                Retry
              </button>
            )}
            <button type="button" className="button button-primary" onClick={tuneDone ? restart : advance} autoFocus>
              {tuneDone ? "Start over" : "Next chord"} <kbd>↵</kbd>
            </button>
          </>
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
      </dl>

      <Settings
        requireRootInBass={requireRootInBass}
        onRequireRootInBassChange={setRequireRootInBass}
        showNoteNames={showNoteNames}
        onShowNoteNamesChange={setShowNoteNames}
        autoSubmit={autoSubmit}
        onAutoSubmitChange={setAutoSubmit}
        playSound={playSound}
        onPlaySoundChange={setPlaySound}
        onRestart={restart}
      />
    </div>
  );
}

function sectionName(step: StandardStep, standard: JazzStandard): string {
  const occurrences = standard.form.filter((key) => standard.sections[key]?.label === step.sectionLabel).length;
  return occurrences > 1 ? `${step.sectionLabel} (${ordinal(step.formIndex)})` : step.sectionLabel;
}

function ordinal(n: number): string {
  const suffix = ["th", "st", "nd", "rd"][n % 10 > 3 || Math.floor((n % 100) / 10) === 1 ? 0 : n % 10] ?? "th";
  return `${n}${suffix}`;
}

function describeSelection(count: number, requireRootInBass: boolean): string {
  if (count === 0) {
    return requireRootInBass
      ? "Click the keys to build the chord — root in the bass."
      : "Click the keys to build the chord. Any octave or inversion counts.";
  }
  return `${count} ${count === 1 ? "key" : "keys"} held.`;
}

function Feedback({ chord, grade, tuneDone, stats }: { chord: Chord; grade: Grade; tuneDone: boolean; stats: Stats }) {
  const tones = chordToneNames(chord).join(" · ");

  let body: React.ReactNode;
  if (grade.correct) {
    body = (
      <p>
        <strong>Correct.</strong> {chordSymbol(chord)} is {tones}.
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
      problems.push(
        `missed ${grade.missingPitchClasses.length} ${grade.missingPitchClasses.length === 1 ? "note" : "notes"}`,
      );
    }
    if (grade.extraMidi.length > 0) {
      const verb = grade.extraMidi.length === 1 ? "doesn't" : "don't";
      problems.push(`${grade.extraMidi.length} that ${verb} belong`);
    }
    body = (
      <p>
        <strong>Not quite</strong>
        {problems.length > 0 && ` — ${problems.join(", ")}`}. {chordSymbol(chord)} is {tones} ({chord.quality.formula}
        ).
      </p>
    );
  }

  return (
    <div>
      {body}
      {tuneDone && (
        <p className="progression-summary">
          Tune complete — {stats.correct} of {stats.attempted} correct.
        </p>
      )}
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
  playSound: boolean;
  onPlaySoundChange: (value: boolean) => void;
  onRestart: () => void;
}

function Settings({
  requireRootInBass,
  onRequireRootInBassChange,
  showNoteNames,
  onShowNoteNamesChange,
  autoSubmit,
  onAutoSubmitChange,
  playSound,
  onPlaySoundChange,
  onRestart,
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
          <label className="checkbox">
            <input type="checkbox" checked={playSound} onChange={(event) => onPlaySoundChange(event.target.checked)} />
            <span>Play a sound when a note is pressed</span>
          </label>
        </fieldset>

        <button type="button" className="button button-quiet" onClick={onRestart}>
          Start over from the top
        </button>
      </div>
    </details>
  );
}
