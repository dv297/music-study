import { describe, expect, it } from "vitest";
import { parseRoute } from "../useHashRoute";

describe("parseRoute", () => {
  it("parses a bare exercise route with no query params", () => {
    const route = parseRoute("#/exercise/seventh-chords");
    expect(route.exerciseId).toBe("seventh-chords");
    expect([...route.params.keys()]).toEqual([]);
  });

  it("parses query params after the route", () => {
    const route = parseRoute("#/exercise/seventh-chords?chord=C:maj7");
    expect(route.exerciseId).toBe("seventh-chords");
    expect(route.params.get("chord")).toBe("C:maj7");
  });

  it("decodes percent-encoded query values", () => {
    const route = parseRoute("#/exercise/seventh-chords?chord=F%23:maj7");
    expect(route.params.get("chord")).toBe("F#:maj7");
  });

  it("supports multiple query params", () => {
    const route = parseRoute("#/exercise/two-five-one?key=Bb&foo=bar");
    expect(route.params.get("key")).toBe("Bb");
    expect(route.params.get("foo")).toBe("bar");
  });

  it("returns a null exerciseId for the home route", () => {
    expect(parseRoute("#/").exerciseId).toBeNull();
    expect(parseRoute("").exerciseId).toBeNull();
  });

  it("returns a null exerciseId for an unrecognized hash", () => {
    expect(parseRoute("#/something-else").exerciseId).toBeNull();
  });
});
