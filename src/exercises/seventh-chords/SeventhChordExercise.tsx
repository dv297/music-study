import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Piano, type KeyMark } from "../../components/Piano";
import {
  CHORD_QUALITIES,
  chordAliasSymbols,
  chordSymbol,
  chordToneNames,
  randomChord,
  type Chord,
} from "../../lib/chords";
import { gradeAnswer, type Grade } from "../../lib/grade";
import { pitchClassOfMidi } from "../../lib/notes";

const LOW_MIDI = 48; // C3
const HIGH_MIDI = 72; // C5
const DEFAULT_QUALITY_IDS = ["maj7", "dom7", "min7", "min7b5"];

interface Stats {
  attempted: number;
  correct: number;
  streak: number;
  bestStreak: number;
}

const EMPTY_STATS: Stats = { attempted: 0, correct: 0, streak: 0, bestStreak: 0 };

export function SeventhChordExercise() {
  const [qualityIds, setQualityIds] = useState<string[]>(DEFAULT_QUALITY_IDS);
  const [requireRootInBass, setRequireRootInBass] = useState(false);
  const [showNoteNames, setShowNoteNames] = useState(false);

  const [chord, setChord] = useState<Chord>(() => randomChord(DEFAULT_QUALITY_IDS));
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set<number>());
  const [grade, setGrade] = useState<Grade | null>(null);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);

  // Kept in a ref so the keyboard handler never closes over a stale chord.
  const chordRef = useRef(chord);
  chordRef.current = chord;

  const nextChord = useCallback(() => {
    setChord((previous) => randomChord(qualityIds, previous));
    setSelected(new Set<number>());
    setGrade(null);
  }, [qualityIds]);

  // Re-draw when the settings would make the current chord unreachable.
  useEffect(() => {
    if (!qualityIds.includes(chordRef.current.quality.id)) nextChord();
  }, [nextChord, qualityIds]);

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
    setStats((previous) => {
      const streak = result.correct ? previous.streak + 1 : 0;
      return {
        attempted: previous.attempted + 1,
        correct: previous.correct + (result.correct ? 1 : 0),
        streak,
        bestStreak: Math.max(previous.bestStreak, streak),
      };
    });
  }, [chord, grade, requireRootInBass, selected]);

  const clear = useCallback(() => {
    if (grade) return;
    setSelected(new Set<number>());
  }, [grade]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter") {
        event.preventDefault();
        if (grade) nextChord();
        else submit();
      } else if (event.key === "Escape" || event.key === "Backspace") {
        event.preventDefault();
        clear();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clear, grade, nextChord, submit]);

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

  const aliases = chordAliasSymbols(chord);
  const accuracy = stats.attempted === 0 ? null : Math.round((stats.correct / stats.attempted) * 100);

  return (
    <div className="exercise">
      <header className="prompt">
        <p className="prompt-instruction">Play this chord</p>
        <p className="chord-symbol">{chordSymbol(chord)}</p>
        {aliases.length > 0 && <p className="chord-aliases">also written {aliases.join(" · ")}</p>}
      </header>

      <div className={`verdict verdict-${grade ? (grade.correct ? "correct" : "incorrect") : "pending"}`}>
        {grade ? <Feedback chord={chord} grade={grade} /> : <p>{describeSelection(selected.size, requireRootInBass)}</p>}
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
          <button type="button" className="button button-primary" onClick={nextChord} autoFocus>
            Next chord <kbd>↵</kbd>
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
        qualityIds={qualityIds}
        onQualityIdsChange={setQualityIds}
        requireRootInBass={requireRootInBass}
        onRequireRootInBassChange={setRequireRootInBass}
        showNoteNames={showNoteNames}
        onShowNoteNamesChange={setShowNoteNames}
        onReset={() => setStats(EMPTY_STATS)}
      />
    </div>
  );
}

function describeSelection(count: number, requireRootInBass: boolean): string {
  if (count === 0) {
    return requireRootInBass
      ? "Click the keys to build the chord — root in the bass."
      : "Click the keys to build the chord. Any octave or inversion counts.";
  }
  return `${count} ${count === 1 ? "key" : "keys"} held.`;
}

function Feedback({ chord, grade }: { chord: Chord; grade: Grade }) {
  const tones = chordToneNames(chord).join(" · ");
  if (grade.correct) {
    return (
      <p>
        <strong>Correct.</strong> {chordSymbol(chord)} is {tones}.
      </p>
    );
  }
  if (grade.voicingIssue) {
    return (
      <p>
        <strong>Almost.</strong> {grade.voicingIssue}
      </p>
    );
  }
  const problems: string[] = [];
  if (grade.missingPitchClasses.length > 0) {
    problems.push(`missed ${grade.missingPitchClasses.length} ${grade.missingPitchClasses.length === 1 ? "note" : "notes"}`);
  }
  if (grade.extraMidi.length > 0) {
    const verb = grade.extraMidi.length === 1 ? "doesn't" : "don't";
    problems.push(`${grade.extraMidi.length} that ${verb} belong`);
  }
  return (
    <p>
      <strong>Not quite</strong>
      {problems.length > 0 && ` — ${problems.join(", ")}`}. {chordSymbol(chord)} is {tones} ({chord.quality.formula}).
    </p>
  );
}

interface SettingsProps {
  qualityIds: string[];
  onQualityIdsChange: (ids: string[]) => void;
  requireRootInBass: boolean;
  onRequireRootInBassChange: (value: boolean) => void;
  showNoteNames: boolean;
  onShowNoteNamesChange: (value: boolean) => void;
  onReset: () => void;
}

function Settings({
  qualityIds,
  onQualityIdsChange,
  requireRootInBass,
  onRequireRootInBassChange,
  showNoteNames,
  onShowNoteNamesChange,
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
          <legend>Chord qualities</legend>
          <div className="quality-grid">
            {CHORD_QUALITIES.map((quality) => (
              <label key={quality.id} className="checkbox">
                <input
                  type="checkbox"
                  checked={qualityIds.includes(quality.id)}
                  onChange={() => toggleQuality(quality.id)}
                />
                <span>
                  {quality.name} <span className="quality-suffix">C{quality.suffix}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

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
        </fieldset>

        <button type="button" className="button button-quiet" onClick={onReset}>
          Reset score
        </button>
      </div>
    </details>
  );
}
