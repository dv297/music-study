import type { ReactNode } from "react";

/** The "Tutorial" accordion shown below Settings in every exercise. */
export function Tutorial({ children }: { children: ReactNode }) {
  return (
    <details className="settings">
      <summary>Tutorial</summary>
      <div className="settings-body">{children}</div>
    </details>
  );
}
