export function JazzStandardsTutorial() {
  return (
    <>
      <section className="tutorial-section">
        <h3>The same chords, in context</h3>
        <p>
          This exercise doesn't introduce new chord types — every chord in a standard's chart is one of the qualities
          from the 7th Chords exercise (major 7th, dominant 7th, minor 7th), just applied on a real tune instead of a
          random root. The skill being drilled here is different, though: reading a chart in real time and building each
          chord before the next one arrives, the way you would with a lead sheet on a stand.
        </p>
      </section>

      <section className="tutorial-section">
        <h3>Reading the form</h3>
        <p>
          Most 32-bar standards, Misty included, are built in AABA form: an 8-bar A section, played again, an 8-bar
          bridge (also called the release) that goes somewhere harmonically different, and then a final A to close.
          That's why the progress bar shows the A section's chords three separate times — it's the same material coming
          back around, not a transcription error.
        </p>
      </section>

      <section className="tutorial-section">
        <h3>Spotting ii–V–I inside the chart</h3>
        <p>
          Once you know the ii–V–I shape, you'll start seeing it everywhere inside standards. Misty's A section, for
          instance, has two of them: B♭m7 leading through E♭7 to A♭maj7 is a ii–V–I in A♭, and later, Fm7–B♭7 resolves
          into E♭maj7 — a ii–V–I in E♭, which also happens to be the tune's home key. Recognizing the pattern lets you
          predict the next chord's quality before it's revealed, instead of reading each one cold.
        </p>
      </section>
    </>
  );
}
