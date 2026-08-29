/** Props every exercise component receives from the router. */
export interface ExerciseComponentProps {
  /**
   * Query params from the current hash route, e.g. "chord=Cmaj7" in
   * "#/exercise/seventh-chords?chord=Cmaj7". Lets a deep link pin the
   * initial prompt instead of drawing a random one — mainly so Playwright
   * tests can land on a known prompt instead of asserting against whatever
   * came up.
   */
  params: URLSearchParams;
}
