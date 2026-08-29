import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Piano, type KeyMark } from "../../components/Piano";
import { Tutorial } from "../../components/Tutorial";
import { AUTO_SUBMIT_REPLAY_DELAY_SECONDS, useReplaySound } from "../../hooks/usePianoSound";
import { useStoredState } from "../../hooks/useStoredState";
import { gradeAnswer, type Grade } from "../../lib/grade";
import { pitchClassOfMidi } from "../../lib/notes";
import { scaleReplayGroups } from "../../lib/replay";
import {
  parseScaleId,
  randomScale,
  scaleId,
  scaleSymbol,
  scaleToneNames,
  SCALE_QUALITIES,
  type Scale,
} from "../../lib/scales";
import type { ExerciseComponentProps } from "../types";
import { DiminishedScaleTutorial } from "./Tutorial";

const LOW_MIDI = 48; // C3
const HIGH_MIDI = 72; // C5
const DEFAULT_QUALITY_IDS = SCALE_QUALITIES.map((quality) => quality.id);
const SETTINGS_PREFIX = "music-study:diminished-scale:";

interface Stats {
  attempted: number;
  correct: number;
  streak: number;
  bestStreak: number;
}

const EMPTY_STATS: Stats = { attempted: 0, correct: 0, streak: 0, bestStreak: 0 };

export function DiminishedScaleExercise({ params }: ExerciseComponentProps) {
  const [qualityIds, setQualityIds] = useStoredState<string[]>(`${SETTINGS_PREFIX}qualityIds`, DEFAULT_QUALITY_IDS);
  const [showNoteNames, setShowNoteNames] = useStoredState(`${SETTINGS_PREFIX}showNoteNames`, false);
  const [autoSubmit, setAutoSubmit] = useStoredState(`${SETTINGS_PREFIX}autoSubmit`, false);
  const [playSound, setPlaySound] = useStoredState(`${SETTINGS_PREFIX}playSound`, true);
  const [replayOnSuccess, setReplayOnSuccess] = useStoredState(`${SETTINGS_PREFIX}replayOnSuccess`, true);
  const playReplay = useReplaySound(replayOnSuccess);

  // A ?scale=Bb:halfWhole param (see scaleId()) pins the opening prompt
  // instead of drawing a random one, so a Playwright test can land on a
  // known scale.
  const forcedScale = useMemo(() => {
    const raw = params.get("scale");
    return raw ? parseScaleId(raw.trim()) : undefined;
  }, [params]);

  // Computed once for the initial render and fed to useRef/useState's own
  // initial-value slots, rather than mutating the ref from inside a
  // useState initializer — reading or writing a ref during render (even in
  // a lazy initializer) isn't safe. Empty deps are intentional: this is a
  // mount-only pick, same intent as useState's lazy initializer.
  const initialPick = useMemo(() => {
    if (forcedScale) return { scale: forcedScale, used: new Set([scaleId(forcedScale)]) };
    return randomScale(qualityIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tracks which scales this cycle has already drawn so nextScale() avoids
  // repeating one until the rest of the pool has come up.
  const usedScalesRef = useRef<Set<string>>(initialPick.used);
  const [scale, setScale] = useState<Scale>(initialPick.scale);
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set<number>());
  const [grade, setGrade] = useState<Grade | null>(null);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);

  // Kept in sync via effect (rather than written during render) so the
  // keyboard handler never closes over a stale scale.
  const scaleRef = useRef(scale);
  useEffect(() => {
    scaleRef.current = scale;
  });

  const nextScale = useCallback(() => {
    const picked = randomScale(qualityIds, usedScalesRef.current);
    usedScalesRef.current = picked.used;
    setScale(picked.scale);
    setSelected(new Set<number>());
    setGrade(null);
  }, [qualityIds]);

  // Re-draw when the settings would make the current scale unreachable —
  // except a forced scale gets one free pass on mount so it isn't
  // immediately swapped out by whatever quality settings happen to be
  // stored from a previous session.
  const skipReconcileRef = useRef(Boolean(forcedScale));
  useEffect(() => {
    if (skipReconcileRef.current) {
      skipReconcileRef.current = false;
      return;
    }
    if (!qualityIds.includes(scaleRef.current.quality.id)) nextScale();
  }, [nextScale, qualityIds]);

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
    const result = gradeAnswer(scale, [...selected], { requireRootInBass: false });
    setGrade(result);
    if (result.correct) {
      playReplay(scaleReplayGroups(scale.tones, LOW_MIDI), autoSubmit ? AUTO_SUBMIT_REPLAY_DELAY_SECONDS : 0);
    }
    setStats((previous) => {
      const streak = result.correct ? previous.streak + 1 : 0;
      return {
        attempted: previous.attempted + 1,
        correct: previous.correct + (result.correct ? 1 : 0),
        streak,
        bestStreak: Math.max(previous.bestStreak, streak),
      };
    });
  }, [autoSubmit, grade, playReplay, scale, selected]);

  const clear = useCallback(() => {
    if (grade) return;
    setSelected(new Set<number>());
  }, [grade]);

  const retry = useCallback(() => {
    setSelected(new Set<number>());
    setGrade(null);
  }, []);

  // Auto-submit once the selection has as many notes as the scale needs.
  // Deliberately an effect rather than a call inside toggleKey — see the
  // same pattern in SeventhChordExercise.tsx.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoSubmit && !grade && selected.size >= scale.pitchClasses.length) submit();
  }, [autoSubmit, grade, scale, selected, submit]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter") {
        event.preventDefault();
        if (grade) nextScale();
        else submit();
      } else if (event.key === "Escape" || event.key === "Backspace") {
        event.preventDefault();
        clear();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clear, grade, nextScale, submit]);

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

  const accuracy = stats.attempted === 0 ? null : Math.round((stats.correct / stats.attempted) * 100);

  return (
    <div className="exercise">
      <header className="prompt">
        <p className="prompt-instruction">Play this scale</p>
        <p className="chord-symbol">{scaleSymbol(scale)}</p>
      </header>

      <div className={`verdict verdict-${grade ? (grade.correct ? "correct" : "incorrect") : "pending"}`}>
        {grade ? <Feedback scale={scale} grade={grade} /> : <p>{describeSelection(selected.size)}</p>}
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
            <button type="button" className="button button-primary" onClick={nextScale} autoFocus>
              Next scale <kbd>↵</kbd>
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
        qualityIds={qualityIds}
        onQualityIdsChange={setQualityIds}
        showNoteNames={showNoteNames}
        onShowNoteNamesChange={setShowNoteNames}
        autoSubmit={autoSubmit}
        onAutoSubmitChange={setAutoSubmit}
        playSound={playSound}
        onPlaySoundChange={setPlaySound}
        replayOnSuccess={replayOnSuccess}
        onReplayOnSuccessChange={setReplayOnSuccess}
        onReset={() => setStats(EMPTY_STATS)}
      />

      <Tutorial>
        <DiminishedScaleTutorial />
      </Tutorial>
    </div>
  );
}

function describeSelection(count: number): string {
  if (count === 0) return "Click the keys to build the scale, in any order or octave.";
  return `${count} ${count === 1 ? "key" : "keys"} held.`;
}

function Feedback({ scale, grade }: { scale: Scale; grade: Grade }) {
  const tones = scaleToneNames(scale).join(" · ");
  if (grade.correct) {
    return (
      <p>
        <strong>Correct.</strong> {scaleSymbol(scale)} is {tones}.
      </p>
    );
  }
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
  return (
    <p>
      <strong>Not quite</strong>
      {problems.length > 0 && ` — ${problems.join(", ")}`}. {scaleSymbol(scale)} is {tones} ({scale.quality.formula}).
    </p>
  );
}

interface SettingsProps {
  qualityIds: string[];
  onQualityIdsChange: (ids: string[]) => void;
  showNoteNames: boolean;
  onShowNoteNamesChange: (value: boolean) => void;
  autoSubmit: boolean;
  onAutoSubmitChange: (value: boolean) => void;
  playSound: boolean;
  onPlaySoundChange: (value: boolean) => void;
  replayOnSuccess: boolean;
  onReplayOnSuccessChange: (value: boolean) => void;
  onReset: () => void;
}

function Settings({
  qualityIds,
  onQualityIdsChange,
  showNoteNames,
  onShowNoteNamesChange,
  autoSubmit,
  onAutoSubmitChange,
  playSound,
  onPlaySoundChange,
  replayOnSuccess,
  onReplayOnSuccessChange,
  onReset,
}: SettingsProps) {
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
          <legend>Scale forms</legend>
          <div className="quality-grid">
            {SCALE_QUALITIES.map((quality) => (
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

        <fieldset>
          <legend>Options</legend>
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
          <label className="checkbox">
            <input
              type="checkbox"
              checked={replayOnSuccess}
              onChange={(event) => onReplayOnSuccessChange(event.target.checked)}
            />
            <span>Play the scale back, note by note, after a correct answer</span>
          </label>
        </fieldset>

        <button type="button" className="button button-quiet" onClick={onReset}>
          Reset score
        </button>
      </div>
    </details>
  );
}
