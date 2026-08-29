/** Generic "shuffle bag" random selection, shared by the chord and progression generators. */

/**
 * Picks a random item from `candidates`, avoiding anything already in
 * `used` while that still leaves a choice — so every candidate is drawn
 * once before any of them repeats, the way dealing from a shuffled deck
 * works rather than an independent die roll each time. Plain uniform
 * randomness feels clumpy over a short session (the same chord can turn up
 * three times in ten picks) even though it's mathematically fine; tracking
 * what this cycle has already used is what fixes that.
 *
 * Pass the returned `used` back in on the next call. Once every candidate
 * has appeared, the next cycle starts fresh — except the pick that just
 * completed the previous cycle stays excluded for one more draw, so a
 * cycle boundary can never repeat a chord back to back either.
 */
export function pickFromBag<T>(
  candidates: readonly T[],
  key: (item: T) => string,
  used: ReadonlySet<string>,
  random: () => number = Math.random,
): { value: T; used: Set<string> } {
  if (candidates.length === 0) throw new Error("No candidates to pick from");

  const unused = candidates.filter((item) => !used.has(key(item)));
  const pool = unused.length > 0 ? unused : candidates;
  const value = pool[Math.floor(random() * pool.length) % pool.length];
  const valueKey = key(value);

  const drawnThisCycle = unused.length > 0 ? new Set(used) : new Set<string>();
  drawnThisCycle.add(valueKey);
  const nextUsed = drawnThisCycle.size >= candidates.length ? new Set([valueKey]) : drawnThisCycle;
  return { value, used: nextUsed };
}
