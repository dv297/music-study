export function SeventhChordsTutorial() {
  return (
    <>
      <section className="tutorial-section">
        <h3>What makes a 7th chord</h3>
        <p>
          Every chord here is a triad — root, 3rd, 5th — with one more third stacked on top. Two intervals decide which
          quality you end up with: the 3rd (major or minor above the root) and the 7th (major or minor above the root).
          Get those two right and the 5th almost always falls into place on its own, since it's just a perfect 5th above
          the root unless the quality specifically raises or lowers it.
        </p>
      </section>

      <section className="tutorial-section">
        <h3>The seven qualities</h3>
        <ul>
          <li>
            <strong>Major 7th (△7)</strong> — major triad, major 7th: <code className="tutorial-formula">1 3 5 7</code>.
            C△7 = C E G B.
          </li>
          <li>
            <strong>Dominant 7th (7)</strong> — major triad, minor 7th:{" "}
            <code className="tutorial-formula">1 3 5 ♭7</code>. C7 = C E G B♭. The only difference from a major 7th
            chord is that one interval — flatten the 7th and a major 7th chord becomes dominant.
          </li>
          <li>
            <strong>Minor 7th (m7)</strong> — minor triad, minor 7th:{" "}
            <code className="tutorial-formula">1 ♭3 5 ♭7</code>. Cm7 = C E♭ G B♭.
          </li>
          <li>
            <strong>Half-diminished (ø7)</strong> — diminished triad (minor 3rd + diminished 5th), minor 7th:{" "}
            <code className="tutorial-formula">1 ♭3 ♭5 ♭7</code>. Cø7 = C E♭ G♭ B♭. Same notes as a minor 7th chord with
            the 5th also dropped a half step.
          </li>
          <li>
            <strong>Diminished 7th (°7)</strong> — diminished triad, diminished 7th:{" "}
            <code className="tutorial-formula">1 ♭3 ♭5 ♭♭7</code>. C°7 = C E♭ G♭ B♭♭. This one is built entirely from
            stacked minor 3rds, which is why it's spelled with a double-flat 7th (enharmonically the same key as A)
            rather than a plain 6th — every interval in the chord has to be some flavor of 3rd.
          </li>
          <li>
            <strong>Minor-major 7th (mMaj7)</strong> — minor triad, major 7th:{" "}
            <code className="tutorial-formula">1 ♭3 5 7</code>. CmMaj7 = C E♭ G B. A minor chord with a major-7th
            chord's top note — the sound behind a lot of moody film-score cadences.
          </li>
          <li>
            <strong>Altered dominant (7♯5)</strong> — major triad with a raised 5th, minor 7th:{" "}
            <code className="tutorial-formula">1 3 ♯5 ♭7</code>. C7♯5 = C E G♯ B♭.
          </li>
          <li>
            <strong>Major 7♯5</strong> — major triad with a raised 5th, major 7th:{" "}
            <code className="tutorial-formula">1 3 ♯5 7</code>. Cmaj7♯5 = C E G♯ B.
          </li>
        </ul>
      </section>

      <section className="tutorial-section">
        <h3>Spelling one quickly</h3>
        <p>
          Read the suffix first, not the root — it's the part that tells you the interval formula. Once you know you're
          building, say, a half-diminished chord, count up from the root: a minor 3rd, then a diminished 5th (a minor
          3rd above that), then a minor 7th (another minor 3rd above that). Thinking in a chain of thirds is usually
          faster on an unfamiliar root than trying to recall the whole chord shape at once.
        </p>
        <p>
          Grading only cares about which keys you press, not how you spell them in your head or which octave or
          inversion you use — so if double-checking a flat against its sharp equivalent slows you down, don't worry
          about it while you're still building speed.
        </p>
      </section>
    </>
  );
}
