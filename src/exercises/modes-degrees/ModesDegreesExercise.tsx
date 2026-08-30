import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Piano, type KeyMark } from "../../components/Piano";
import { Tutorial } from "../../components/Tutorial";
import { useStoredState } from "../../hooks/useStoredState";
import {
  findModeQuality,
  gradeModeDegrees,
  MODE_QUALITIES,
  modeDegreeAlterations,
  modeDegreeMidiNotes,
  randomModeQuality,
  type DegreeAlteration,
  type DegreeGrade,
  type ModeQuality,
} from "../../lib/modes";
import { MIDDLE_C } from "../../lib/notes";
import type { ExerciseComponentProps } from "../types";
import { ModesDegreesTutorial } from "./Tutorial";

const DEGREES = [1, 2, 3, 4, 5, 6, 7] as const;
const DEFAULT_QUALITY_IDS = MODE_QUALITIES.map((quality) => quality.id);
const SETTINGS_PREFIX = "music-study:modes-degrees:";
const NATURAL_ANSWER: DegreeAlteration[] = DEGREES.map(() => "natural");

// The keyboard overlay is purely illustrative — degree alterations don't
// depend on a root (see modeDegreeAlterations in lib/modes.ts) — so it's
// always drawn from middle C through the octave above, and never accepts
// input.
const DEGREE_KEYBOARD_LOW = MIDDLE_C;
const DEGREE_KEYBOARD_HIGH = MIDDLE_C + 12;
const EMPTY_SELECTION = new Set<number>();
function noop() {}

interface Stats {
  attempted: number;
  correct: number;
  streak: number;
  bestStreak: number;
}

const EMPTY_STATS: Stats = { attempted: 0, correct: 0, streak: 0, bestStreak: 0 };

export function ModesDegreesExercise({ params }: ExerciseComponentProps) {
  const [qualityIds, setQualityIds] = useStoredState<string[]>(`${SETTINGS_PREFIX}qualityIds`, DEFAULT_QUALITY_IDS);

  // A ?mode=dorian param (the quality id — no root, since alterations don't
  // depend on one) pins the opening prompt instead of drawing a random one,
  // so a Playwright test can land on a known mode.
  const forcedQuality = useMemo(() => {
    const raw = params.get("mode");
    return raw ? findModeQuality(raw.trim()) : undefined;
  }, [params]);

  // Computed once for the initial render and fed to useRef/useState's own
  // initial-value slots, rather than mutating the ref from inside a
  // useState initializer — reading or writing a ref during render (even in
  // a lazy initializer) isn't safe. Empty deps are intentional: this is a
  // mount-only pick, same intent as useState's lazy initializer.
  const initialPick = useMemo(() => {
    if (forcedQuality) return { quality: forcedQuality, used: new Set([forcedQuality.id]) };
    return randomModeQuality(qualityIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tracks which mode qualities this cycle has already drawn so
  // nextQuality() avoids repeating one until the rest of the pool has come
  // up.
  const usedQualitiesRef = useRef<Set<string>>(initialPick.used);
  const [quality, setQuality] = useState<ModeQuality>(initialPick.quality);
  const [answer, setAnswer] = useState<readonly DegreeAlteration[]>(NATURAL_ANSWER);
  const [grade, setGrade] = useState<DegreeGrade | null>(null);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);

  // Kept in sync via effect (rather than written during render) so the
  // keyboard handler never closes over a stale quality.
  const qualityRef = useRef(quality);
  useEffect(() => {
    qualityRef.current = quality;
  });

  const nextQuality = useCallback(() => {
    const picked = randomModeQuality(qualityIds, usedQualitiesRef.current);
    usedQualitiesRef.current = picked.used;
    setQuality(picked.quality);
    setAnswer(NATURAL_ANSWER);
    setGrade(null);
  }, [qualityIds]);

  // Re-draw when the settings actually change and would make the current
  // mode unreachable — a forced mode is exempt on mount so it isn't
  // immediately swapped out by whatever quality settings happen to be
  // stored from a previous session. Keyed off the qualityIds reference
  // itself (rather than a "have I run yet" flag) so this stays a no-op
  // across React StrictMode's dev-only double-invocation of mount effects —
  // a flag consumed on the first call would wrongly fire the reconcile on
  // the second, discarding a still-valid forced mode.
  const reconciledQualityIdsRef = useRef(qualityIds);
  useEffect(() => {
    if (reconciledQualityIdsRef.current === qualityIds) return;
    reconciledQualityIdsRef.current = qualityIds;
    if (!qualityIds.includes(qualityRef.current.id)) nextQuality();
  }, [nextQuality, qualityIds]);

  const toggleDegree = useCallback((index: number, alteration: "sharp" | "flat") => {
    setAnswer((previous) => {
      const next = [...previous];
      next[index] = previous[index] === alteration ? "natural" : alteration;
      return next;
    });
  }, []);

  const submit = useCallback(() => {
    if (grade) return;
    const result = gradeModeDegrees(quality, answer);
    setGrade(result);
    setStats((previous) => {
      const streak = result.correct ? previous.streak + 1 : 0;
      return {
        attempted: previous.attempted + 1,
        correct: previous.correct + (result.correct ? 1 : 0),
        streak,
        bestStreak: Math.max(previous.bestStreak, streak),
      };
    });
  }, [answer, grade, quality]);

  const clear = useCallback(() => {
    if (grade) return;
    setAnswer(NATURAL_ANSWER);
  }, [grade]);

  const retry = useCallback(() => {
    setAnswer(NATURAL_ANSWER);
    setGrade(null);
  }, []);

  // No auto-submit here — unlike the piano exercises, there's no natural
  // "enough notes selected" signal, since a fully-natural answer (Ionian)
  // is itself a complete, valid guess.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter") {
        event.preventDefault();
        if (grade) nextQuality();
        else submit();
      } else if (event.key === "Escape" || event.key === "Backspace") {
        event.preventDefault();
        clear();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clear, grade, nextQuality, submit]);

  const expected = useMemo(() => modeDegreeAlterations(quality), [quality]);
  const accuracy = stats.attempted === 0 ? null : Math.round((stats.correct / stats.attempted) * 100);

  // Only built once there's a wrong answer to illustrate — a correct answer
  // already gets its "Correct." feedback, and the keyboard would just repeat
  // what the (still-visible, now-disabled) degree grid already shows.
  const degreeKeyboard = useMemo(() => {
    if (!grade || grade.correct) return null;
    const marks = new Map<number, KeyMark>();
    const keyLabels = new Map<number, string>();
    modeDegreeMidiNotes(quality).forEach((midi, index) => {
      const degree = index + 1;
      marks.set(midi, grade.correctDegrees.includes(degree) ? "correct" : "missing");
      keyLabels.set(midi, degreeKeyLabel(degree, expected[index]));
    });
    return { marks, keyLabels };
  }, [expected, grade, quality]);

  return (
    <div className="exercise">
      <header className="prompt">
        <p className="prompt-instruction">Alter each degree for this mode</p>
        <p className="chord-symbol">{quality.name}</p>
      </header>

      <div className={`verdict verdict-${grade ? (grade.correct ? "correct" : "incorrect") : "pending"}`}>
        {grade ? (
          <Feedback quality={quality} grade={grade} />
        ) : (
          <p>Toggle ♯ or ♭ on any degree that needs it — leave the rest natural.</p>
        )}
      </div>

      {degreeKeyboard && (
        <div className="degree-keyboard">
          <p className="degree-keyboard-caption">
            {quality.name} from C — green is what you got right, gold is what to fix. Same shape in any key.
          </p>
          <Piano
            lowMidi={DEGREE_KEYBOARD_LOW}
            highMidi={DEGREE_KEYBOARD_HIGH}
            selected={EMPTY_SELECTION}
            onToggle={noop}
            marks={degreeKeyboard.marks}
            keyLabels={degreeKeyboard.keyLabels}
            disabled
          />
        </div>
      )}

      <div className="degree-grid" role="group" aria-label="Scale degree alterations">
        {DEGREES.map((degree, index) => (
          <button
            key={`sharp-${degree}`}
            type="button"
            className={degreeToggleClassName("sharp", index, answer, grade, expected)}
            onClick={() => toggleDegree(index, "sharp")}
            disabled={Boolean(grade)}
            aria-pressed={answer[index] === "sharp"}
            aria-label={`Degree ${degree} sharp`}
          >
            ♯
          </button>
        ))}
        {DEGREES.map((degree, index) => (
          <span key={`label-${degree}`} className={degreeLabelClassName(index, grade)}>
            {degree}
          </span>
        ))}
        {DEGREES.map((degree, index) => (
          <button
            key={`flat-${degree}`}
            type="button"
            className={degreeToggleClassName("flat", index, answer, grade, expected)}
            onClick={() => toggleDegree(index, "flat")}
            disabled={Boolean(grade)}
            aria-pressed={answer[index] === "flat"}
            aria-label={`Degree ${degree} flat`}
          >
            ♭
          </button>
        ))}
      </div>

      <div className="actions">
        {grade ? (
          <>
            {!grade.correct && (
              <button type="button" className="button" onClick={retry}>
                Retry
              </button>
            )}
            <button type="button" className="button button-primary" onClick={nextQuality} autoFocus>
              Next mode <kbd>↵</kbd>
            </button>
          </>
        ) : (
          <>
            <button type="button" className="button button-primary" onClick={submit}>
              Check <kbd>↵</kbd>
            </button>
            <button type="button" className="button" onClick={clear}>
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

      <Settings qualityIds={qualityIds} onQualityIdsChange={setQualityIds} onReset={() => setStats(EMPTY_STATS)} />

      <Tutorial>
        <ModesDegreesTutorial />
      </Tutorial>
    </div>
  );
}

function degreeToggleClassName(
  kind: "sharp" | "flat",
  index: number,
  answer: readonly DegreeAlteration[],
  grade: DegreeGrade | null,
  expected: readonly DegreeAlteration[],
): string {
  const degree = index + 1;
  const isActive = answer[index] === kind;
  const wasWrong = grade ? !grade.correctDegrees.includes(degree) : false;
  const isMissing = wasWrong && !isActive && expected[index] === kind;

  const classes = [
    "degree-toggle",
    isActive ? "is-active" : "",
    isActive && grade ? (wasWrong ? "is-incorrect" : "is-correct") : "",
    isMissing ? "is-missing" : "",
  ];
  return classes.filter(Boolean).join(" ");
}

function degreeLabelClassName(index: number, grade: DegreeGrade | null): string {
  if (!grade) return "degree-label";
  const correct = grade.correctDegrees.includes(index + 1);
  return `degree-label ${correct ? "is-correct" : "is-incorrect"}`;
}

/** "♭3", "♯4", "5" — a scale-degree key-overlay label, root-independent. */
function degreeKeyLabel(degree: number, alteration: DegreeAlteration): string {
  if (alteration === "sharp") return `♯${degree}`;
  if (alteration === "flat") return `♭${degree}`;
  return `${degree}`;
}

function Feedback({ quality, grade }: { quality: ModeQuality; grade: DegreeGrade }) {
  if (grade.correct) {
    return (
      <p>
        <strong>Correct.</strong> {quality.name} is <code className="formula-chip">{quality.formula}</code>.
      </p>
    );
  }
  const problems = grade.wrongDegrees
    .map(({ degree, expected }) => `degree ${degree} should be ${alterationLabel(expected)}`)
    .join(", ");
  return (
    <p>
      <strong>Not quite</strong> — {problems}. {quality.name} is <code className="formula-chip">{quality.formula}</code>
      .
    </p>
  );
}

function alterationLabel(alteration: DegreeAlteration): string {
  if (alteration === "sharp") return "♯";
  if (alteration === "flat") return "♭";
  return "natural";
}

interface SettingsProps {
  qualityIds: string[];
  onQualityIdsChange: (ids: string[]) => void;
  onReset: () => void;
}

function Settings({ qualityIds, onQualityIdsChange, onReset }: SettingsProps) {
  const toggleQuality = (id: string) => {
    const next = qualityIds.includes(id) ? qualityIds.filter((existing) => existing !== id) : [...qualityIds, id];
    // Always leave at least one quality in the pool.
    if (next.length > 0) onQualityIdsChange(next);
  };

  return (
    <details className="settings">
      <summary>Settings</summary>
      <div className="settings-body">
        <fieldset>
          <legend>Modes</legend>
          <div className="quality-grid">
            {MODE_QUALITIES.map((quality) => (
              <label key={quality.id} className="checkbox">
                <input
                  type="checkbox"
                  checked={qualityIds.includes(quality.id)}
                  onChange={() => toggleQuality(quality.id)}
                />
                <span>{quality.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button type="button" className="button button-quiet" onClick={onReset}>
          Reset score
        </button>
      </div>
    </details>
  );
}
