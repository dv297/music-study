import { useEffect, useState } from "react";

export interface HashRoute {
  /** The exercise id from the URL, e.g. "seventh-chords". Null off the exercise routes. */
  exerciseId: string | null;
  /** Query params after the route, e.g. "chord=Cmaj7" in "#/exercise/seventh-chords?chord=Cmaj7". */
  params: URLSearchParams;
}

const ROUTE_PATTERN = /^#\/exercise\/([\w-]+)(?:\?(.*))?$/;

/**
 * Query params live inside the hash (after the route's own "?") rather than
 * in the page's real search string, so a deep link is one self-contained
 * URL and the params never leak into a later in-app navigation.
 */
export function parseRoute(hash: string): HashRoute {
  const match = ROUTE_PATTERN.exec(hash);
  if (!match) return { exerciseId: null, params: new URLSearchParams() };
  return { exerciseId: match[1], params: new URLSearchParams(match[2] ?? "") };
}

/** Hash routing keeps a reload on an exercise working without a router dependency. */
export function useHashRoute(): HashRoute {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  return route;
}
