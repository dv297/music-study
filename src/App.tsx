import { EXERCISES, findExercise } from "./exercises/registry";
import { useHashRoute } from "./hooks/useHashRoute";
import { JAZZ_STANDARDS, standardSteps } from "./lib/standards";

export function App() {
  const { exerciseId, params } = useHashRoute();
  const exercise = findExercise(exerciseId);

  return (
    <div className="app">
      <header className="app-header">
        <a className="app-title" href="#/">
          Music Study
        </a>
        {exercise && <span className="app-breadcrumb">{exercise.title}</span>}
      </header>

      <main className="app-main">{exercise?.component ? <exercise.component params={params} /> : <Home />}</main>
    </div>
  );
}

function Home() {
  const exercises = EXERCISES.filter((exercise) => exercise.category !== "standard");
  return (
    <div className="home">
      <h1>Pick an exercise</h1>
      <p className="home-lede">Drills for the theory you want under your fingers, not just in your head.</p>
      <ul className="exercise-list">
        {exercises.map((exercise) => {
          const available = Boolean(exercise.component);
          return (
            <li key={exercise.id}>
              {available ? (
                <a className="exercise-card" href={`#/exercise/${exercise.id}`}>
                  <h2>{exercise.title}</h2>
                  <p>{exercise.summary}</p>
                </a>
              ) : (
                <div className="exercise-card is-disabled" aria-disabled="true">
                  <h2>
                    {exercise.title} <span className="badge">soon</span>
                  </h2>
                  <p>{exercise.summary}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <section className="home-section">
        <h1>Jazz Standards</h1>
        <p className="home-lede">
          Pick a standard, then play its changes on the piano in the order the head is played.
        </p>
        <ul className="exercise-list">
          {JAZZ_STANDARDS.map((standard) => (
            <li key={standard.id}>
              <a className="exercise-card" href={`#/exercise/jazz-standards?standard=${standard.id}`}>
                <h2>{standard.title}</h2>
                <p>
                  {standard.key} · {standardSteps(standard).length} chords
                </p>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
