export function DiminishedScaleTutorial() {
  return (
    <>
      <section className="tutorial-section">
        <h3>An eight-note, symmetric scale</h3>
        <p>
          Unlike a major scale's mix of whole and half steps, the diminished scale alternates strictly between the two —
          eight notes instead of seven, all the way around the octave. Which interval comes first is the only thing that
          changes between the two forms:
        </p>
        <ul>
          <li>
            <strong>Whole-Half</strong> — whole, half, whole, half, whole, half, whole, half from the root:{" "}
            <code className="tutorial-formula">1 2 ♭3 4 ♭5 ♭6 6 7</code>. C W–H = C D E♭ F G♭ A♭ A B.
          </li>
          <li>
            <strong>Half-Whole</strong> — half, whole, half, whole, half, whole, half, whole from the root:{" "}
            <code className="tutorial-formula">1 ♭2 ♯2 3 ♯4 5 6 ♭7</code>. C H–W = C D♭ D♯ E F♯ G A B♭.
          </li>
        </ul>
        <p>
          The two forms are really the same shape seen from different starting points: play a Whole-Half scale starting
          from its own 2nd note instead of its root, and you get exactly the Half-Whole scale on that note. C W–H
          starting on D, for instance, is D E♭ F G♭ A♭ A B C — the Half-Whole scale on D.
        </p>
      </section>

      <section className="tutorial-section">
        <h3>Why one letter repeats</h3>
        <p>
          Eight pitches don't fit seven letter names, so every diminished scale spells one scale degree twice — once
          natural, once altered. In C Whole-Half that's the 6th degree (A♭ then A); in C Half-Whole it's the 2nd (D♭
          then D♯). That's expected, not a mistake in the feedback you'll see.
        </p>
      </section>

      <section className="tutorial-section">
        <h3>Where each form is used</h3>
        <p>
          Whole-Half contains all four notes of a diminished 7th chord (
          <code className="tutorial-formula">1 ♭3 ♭5 ♭♭7</code>) plus four passing tones, which is why it's played over
          diminished 7th chords. Half-Whole contains all four notes of a dominant 7th chord (
          <code className="tutorial-formula">1 3 5 ♭7</code>) plus the ♭9, ♯9, and ♯11 — the altered tensions jazz
          players reach for over dominant chords. Leaning on those built-in chord tones, rather than memorizing eight
          notes as an unbroken string, makes the scale much faster to find under pressure.
        </p>
        <p>
          Because the scale repeats every minor 3rd, there are only three distinct Whole-Half scales and three distinct
          Half-Whole scales in total — C, E♭, F♯/G♭, and A all share one Whole-Half scale, just starting in a different
          place. Once one is under your fingers, you already know three more roots' worth.
        </p>
      </section>
    </>
  );
}
