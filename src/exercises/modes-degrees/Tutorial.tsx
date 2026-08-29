export function ModesDegreesTutorial() {
  return (
    <>
      <section className="tutorial-section">
        <h3>What "altering a degree" means</h3>
        <p>
          Every mode is measured against the major scale (Ionian) built on the same root. A degree that matches the
          major scale needs no alteration; a degree that sits a half step lower gets flattened, and a degree that sits a
          half step higher gets sharped. No mode here ever needs a degree moved by more than a half step, so each of the
          seven columns below only ever needs one toggle pressed at most.
        </p>
      </section>

      <section className="tutorial-section">
        <h3>The seven formulas</h3>
        <ul>
          <li>
            <strong>Ionian (Major)</strong> — <code className="formula-chip">1 2 3 4 5 6 7</code> — nothing altered.
          </li>
          <li>
            <strong>Dorian</strong> — <code className="formula-chip">1 2 ♭3 4 5 6 ♭7</code> — flat the 3rd and 7th.
          </li>
          <li>
            <strong>Phrygian</strong> — <code className="formula-chip">1 ♭2 ♭3 4 5 ♭6 ♭7</code> — flat the 2nd, 3rd,
            6th, and 7th.
          </li>
          <li>
            <strong>Lydian</strong> — <code className="formula-chip">1 2 3 ♯4 5 6 7</code> — sharp the 4th.
          </li>
          <li>
            <strong>Mixolydian</strong> — <code className="formula-chip">1 2 3 4 5 6 ♭7</code> — flat the 7th.
          </li>
          <li>
            <strong>Aeolian (Natural Minor)</strong> — <code className="formula-chip">1 2 ♭3 4 5 ♭6 ♭7</code> — flat the
            3rd, 6th, and 7th.
          </li>
          <li>
            <strong>Locrian</strong> — <code className="formula-chip">1 ♭2 ♭3 4 ♭5 ♭6 ♭7</code> — flat every degree
            except the 1st and 4th.
          </li>
        </ul>
      </section>

      <section className="tutorial-section">
        <h3>A pattern worth noticing</h3>
        <p>
          Starting from Ionian (nothing altered) and moving down in brightness, each mode flattens exactly one more
          degree than the last, and never gives one back: Mixolydian flattens the 7th; Dorian keeps that ♭7 and also
          flattens the 3rd; Aeolian keeps both and also flattens the 6th; Phrygian keeps all three and also flattens the
          2nd; Locrian keeps all four and also flattens the 5th, leaving only the root and 4th untouched. Once you can
          place a mode in that order, you already know most of its answer before you touch a toggle.
        </p>
        <p>
          Lydian sits just above Ionian on the bright side, on its own — instead of flattening anything, it's the one
          mode here that sharps a degree, raising the 4th.
        </p>
      </section>
    </>
  );
}
