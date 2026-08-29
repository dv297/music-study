export function ModesTutorial() {
  return (
    <>
      <section className="tutorial-section">
        <h3>A mode is just a rotation</h3>
        <p>
          Every mode here uses the exact same seven notes as some major scale — the only thing that changes is which of
          those notes you treat as the tonic. D Dorian, for example, is nothing more than the notes of C major (no
          sharps or flats) starting and centering on D instead of C. What makes each mode sound distinct isn't new
          pitches, it's which scale degree — measured from the mode's own root — ends up major or minor, raised or
          lowered.
        </p>
      </section>

      <section className="tutorial-section">
        <h3>The seven modes</h3>
        <p>In brightness order — most raised degrees to most lowered, relative to Ionian (the major scale):</p>
        <ul>
          <li>
            <strong>Lydian</strong> — major scale with a raised 4th:{" "}
            <code className="tutorial-formula">1 2 3 ♯4 5 6 7</code>
          </li>
          <li>
            <strong>Ionian (Major)</strong> — the major scale itself:{" "}
            <code className="tutorial-formula">1 2 3 4 5 6 7</code>
          </li>
          <li>
            <strong>Mixolydian</strong> — major scale with a lowered 7th:{" "}
            <code className="tutorial-formula">1 2 3 4 5 6 ♭7</code>
          </li>
          <li>
            <strong>Dorian</strong> — minor scale with a raised 6th:{" "}
            <code className="tutorial-formula">1 2 ♭3 4 5 6 ♭7</code>
          </li>
          <li>
            <strong>Aeolian (Natural Minor)</strong> — the natural minor scale:{" "}
            <code className="tutorial-formula">1 2 ♭3 4 5 ♭6 ♭7</code>
          </li>
          <li>
            <strong>Phrygian</strong> — minor scale with a lowered 2nd:{" "}
            <code className="tutorial-formula">1 ♭2 ♭3 4 5 ♭6 ♭7</code>
          </li>
          <li>
            <strong>Locrian</strong> — minor scale with a lowered 2nd and 5th:{" "}
            <code className="tutorial-formula">1 ♭2 ♭3 4 ♭5 ♭6 ♭7</code>
          </li>
        </ul>
      </section>

      <section className="tutorial-section">
        <h3>Two ways to find one fast</h3>
        <p>
          <strong>Relative method</strong> — work out which major scale the mode belongs to, then just start on the
          right degree of it. Dorian is the major scale's 2nd mode, so if you need D Dorian, ask "D is the 2nd degree of
          which major scale?" — C major — then play C major's notes starting from D.
        </p>
        <p>
          <strong>Parallel method</strong> — start from the root's own major scale and apply the mode's formula
          directly. For E Phrygian, take E major (E F♯ G♯ A B C♯ D♯) and flatten the 2nd, 3rd, 6th, and 7th degrees to
          get E F G A B C D.
        </p>
        <p>
          Neither is "more correct" than the other — use whichever is faster for the root and mode in front of you. The
          relative method tends to win when you already know your key signatures cold; the parallel method tends to win
          when the formula is fresher in your head than the circle of fifths is.
        </p>
      </section>
    </>
  );
}
