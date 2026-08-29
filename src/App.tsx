import { EXERCISES, findExercise } from "./exercises/registry";
import { useHashRoute } from "./hooks/useHashRoute";

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
  return (
    <div className="home">
      <h1>Pick an exercise</h1>
      <p className="home-lede">Drills for the theory you want under your fingers, not just in your head.</p>
      <ul className="exercise-list">
        {EXERCISES.map((exercise) => {
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
    </div>
  );
}
