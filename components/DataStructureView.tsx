import { ALGORITHMS } from "@/lib/search";
import { nodeLabel } from "@/lib/search/common";
import type { AlgorithmId, Maze, SearchStep } from "@/lib/search/types";

const MAX_ROWS = 40;

interface DataStructureViewProps {
  maze: Maze;
  algorithm: AlgorithmId;
  step: SearchStep | null;
}

/**
 * Visar algoritmens frontier: kö (BFS), stack (DFS) eller prioritetskö
 * (Greedy, A*). Posterna visas i uttagsordning – den översta tas ut härnäst.
 */
export function DataStructureView({ maze, algorithm, step }: DataStructureViewProps) {
  const info = ALGORITHMS[algorithm];
  const entries = step?.frontier ?? [];
  const shown = entries.slice(0, MAX_ROWS);
  const added = new Set(step?.addedNodes ?? []);
  const updated = new Set(step?.updatedNodes ?? []);
  // Vid slumpmässig sökning finns ingen "nästa" – den lottas fram vid nästa steg.
  const isRandom = algorithm === "random";
  const firstLabel = isRandom ? 1 : algorithm === "dfs" ? "Topp" : "Nästa";
  const lastLabel = algorithm === "bfs" ? "Sist" : algorithm === "dfs" ? "Botten" : null;

  return (
    <section className="block ds" aria-labelledby="ds-title">
      <h3 id="ds-title">
        {info.structure} <span className="muted">({entries.length} st)</span>
      </h3>
      {isRandom && step && !step.finished && <p className="hint">Nästa nod lottas fram när du klickar på Steg.</p>}

      {!step ? (
        <p className="empty">Tryck på Starta eller Steg så visas {info.structureDefinite} här.</p>
      ) : entries.length === 0 ? (
        <p className="empty">{step.found ? "Målet är hittat." : `${capitalize(info.structureDefinite)} är tom.`}</p>
      ) : (
        <div className="ds-scroll">
        <table className="ds-table">
          <caption className="sr-only">
            Innehållet i {info.structureDefinite}, {isRandom ? "i den ordning noderna lades in" : "i den ordning noderna tas ut"}
          </caption>
          <thead>
            <tr>
              <th scope="col">Plats</th>
              <th scope="col">Ruta</th>
              {algorithm === "astar" && <th scope="col" className="num">g</th>}
              {(algorithm === "greedy" || algorithm === "astar") && <th scope="col" className="num">h</th>}
              {algorithm === "astar" && <th scope="col" className="num">f</th>}
              <th scope="col">
                <span className="sr-only">Status</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((entry, i) => {
              const isLast = i === entries.length - 1 && entries.length > 1;
              return (
                <tr key={entry.node} className={i === 0 && !isRandom ? "ds-next" : undefined}>
                  <td className="ds-pos">{i === 0 ? firstLabel : isLast && lastLabel ? lastLabel : i + 1}</td>
                  <td className="ds-node">{nodeLabel(maze, entry.node)}</td>
                  {algorithm === "astar" && <td className="num">{entry.g}</td>}
                  {(algorithm === "greedy" || algorithm === "astar") && (
                    <td className={`num${algorithm === "greedy" ? " ds-key" : ""}`}>{entry.h}</td>
                  )}
                  {algorithm === "astar" && <td className="num ds-key">{entry.f}</td>}
                  <td className="ds-badges">
                    {added.has(entry.node) && <span className="badge badge-new">ny</span>}
                    {updated.has(entry.node) && (
                      <span className="badge badge-moved">{algorithm === "dfs" ? "flyttad" : "uppdaterad"}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
      {entries.length > MAX_ROWS && (
        <p className="hint">… och {entries.length - MAX_ROWS} till längre {algorithm === "dfs" ? "ned" : "bak"}.</p>
      )}
    </section>
  );
}

function capitalize(text: string): string {
  return text[0].toUpperCase() + text.slice(1);
}
