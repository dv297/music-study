export function TwoFiveOneTutorial() {
  return (
    <>
      <section className="tutorial-section">
        <h3>Where ii–V–I comes from</h3>
        <p>
          Stack a 7th chord on every degree of a major scale, using only notes from that scale, and you get seven
          diatonic chords for free. Do that in C major and the chord on D comes out Dm7, the chord on G comes out G7,
          and the chord on C comes out Cmaj7 — no accidentals needed anywhere. Those three chords, played in that order,
          are the ii–V–I: the most common cadence in jazz, and it always has the same three qualities because it's
          always built the same way, off the 2nd, 5th, and 1st degrees of whatever key you're resolving to.
        </p>
      </section>

      <section className="tutorial-section">
        <h3>Finding ii and V from the key</h3>
        <p>
          The exercise shows you the key (the I chord, i.e. the tonic) and asks for ii and V first, so it's worth being
          able to find them fast without building the whole scale each time:
        </p>
        <ul>
          <li>
            <strong>ii</strong> is a major 2nd above the key, minor 7th quality:{" "}
            <code className="tutorial-formula">1 ♭3 5 ♭7</code>. In F, that's Gm7.
          </li>
          <li>
            <strong>V</strong> is a perfect 5th above the key (or a perfect 4th below it), dominant 7th quality:{" "}
            <code className="tutorial-formula">1 3 5 ♭7</code>. In F, that's C7.
          </li>
          <li>
            <strong>I</strong> is the key itself, major 7th quality: <code className="tutorial-formula">1 3 5 7</code>.
            In F, that's Fmaj7.
          </li>
        </ul>
      </section>

      <section className="tutorial-section">
        <h3>Why it resolves</h3>
        <p>
          The pull toward I comes mostly from the tritone sitting inside V: the interval between its 3rd and ♭7 (in C7,
          E and B♭). Those two notes are a half step away from the 3rd and root of I, so they resolve inward by step —
          B♭ down to A, E up to F, in a C7 → Fmaj7 move. ii doesn't create that tension itself; it sets V up by sharing
          two notes with it (in Gm7 → C7, the G and B♭ carry over) so the bass moves by a strong 4th instead of jumping
          in from nowhere.
        </p>
        <p>
          If you find yourself unsure what ii or V should be, it's usually faster to name the major scale of the key on
          screen and count up two and five degrees than to try to recall the chord shape directly.
        </p>
      </section>
    </>
  );
}
