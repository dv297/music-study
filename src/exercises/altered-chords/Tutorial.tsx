export function AlteredChordsTutorial() {
  return (
    <>
      <section className="tutorial-section">
        <h3>One tension on top of a 7th chord</h3>
        <p>
          Every chord here starts as a dominant, major, or minor 7th chord — the same four notes as the 7th-chords
          exercise — with exactly one more note stacked above the 7th: a 9th, an 11th, or a 13th, natural or altered.
          The 9th, 11th, and 13th are just the 2nd, 4th, and 6th an octave up, so the note you press is identical either
          way — grading doesn't care which octave you use, only the pitch class.
        </p>
      </section>

      <section className="tutorial-section">
        <h3>Why there's no plain 11 or maj11</h3>
        <p>
          A natural 11th sits a half step above the major 3rd, which clashes badly — it's the textbook "avoid note" over
          any chord with a major 3rd. In practice the 11th only shows up two ways: <strong>sharped</strong> (7♯11,
          △7♯11), a half step further from the 3rd and a defining color tone in its own right, or{" "}
          <strong>natural over a minor triad</strong> (m11), where there's no major 3rd for it to clash with.
        </p>
        <p>
          A 13th chord has the same problem in reverse: naming the 13th implies the 9th is there too, but the 11th is
          skipped for the same avoid-note reason. C13 is built <code className="formula-chip">1 3 5 ♭7 9 13</code> — six
          notes, no 11th.
        </p>
      </section>

      <section className="tutorial-section">
        <h3>The ten qualities</h3>
        <ul>
          <li>
            <strong>Dominant 9th (9)</strong> — <code className="formula-chip">1 3 5 ♭7 9</code>. C9 = C E G B♭ D.
          </li>
          <li>
            <strong>Dominant 7♭9</strong> — <code className="formula-chip">1 3 5 ♭7 ♭9</code>. C7♭9 = C E G B♭ D♭.
          </li>
          <li>
            <strong>Dominant 7♯9</strong> — <code className="formula-chip">1 3 5 ♭7 ♯9</code>. C7♯9 = C E G B♭ D♯ — the
            "Hendrix chord."
          </li>
          <li>
            <strong>Dominant 7♯11</strong> — <code className="formula-chip">1 3 5 ♭7 ♯11</code>. C7♯11 = C E G B♭ F♯ —
            the sound of the lydian dominant scale.
          </li>
          <li>
            <strong>Dominant 13th (13)</strong> — <code className="formula-chip">1 3 5 ♭7 9 13</code>. C13 = C E G B♭ D
            A.
          </li>
          <li>
            <strong>Major 9th (△9)</strong> — <code className="formula-chip">1 3 5 7 9</code>. C△9 = C E G B D.
          </li>
          <li>
            <strong>Major 7♯11 (△7♯11)</strong> — <code className="formula-chip">1 3 5 7 ♯11</code>. C△7♯11 = C E G B
            F♯.
          </li>
          <li>
            <strong>Major 13th (△13)</strong> — <code className="formula-chip">1 3 5 7 9 13</code>. C△13 = C E G B D A.
          </li>
          <li>
            <strong>Minor 9th (m9)</strong> — <code className="formula-chip">1 ♭3 5 ♭7 9</code>. Cm9 = C E♭ G B♭ D.
          </li>
          <li>
            <strong>Minor 11th (m11)</strong> — <code className="formula-chip">1 ♭3 5 ♭7 11</code>. Cm11 = C E♭ G B♭ F.
          </li>
        </ul>
      </section>

      <section className="tutorial-section">
        <h3>Spelling one quickly</h3>
        <p>
          Build the underlying 7th chord first — root, 3rd, 5th, 7th, exactly like the 7th-chords exercise — then add
          the one named tension on top. For a 9th, that's a whole step above the root (or a half step either side, if
          altered); for an 11th, a perfect 4th above the root; for a 13th, a major 6th above the root. Thinking of the
          tension relative to the root, not relative to the 7th, is usually faster than trying to count all the way up
          through the stack of thirds.
        </p>
      </section>
    </>
  );
}
