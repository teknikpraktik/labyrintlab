import type { CSSProperties, ReactNode } from "react";
import { columnLetter, nodeLabel, toRowCol } from "@/lib/search/common";
import type { AlgorithmId, Maze, NodeId, SearchStep } from "@/lib/search/types";

interface MazeGridProps {
  maze: Maze;
  step: SearchStep | null;
  algorithm?: AlgorithmId;
  /** Visa h (Greedy) eller f (A*) i rutor som ligger i frontier. */
  showValues?: boolean;
  /** Dekorativ variant utan koordinater, t.ex. på startsidan. */
  compact?: boolean;
}

type CellState = "wall" | "path" | "current" | "frontier" | "visited" | "free";

const STATE_LABEL: Record<CellState, string> = {
  wall: "vägg",
  path: "slutlig väg",
  current: "aktuell nod",
  frontier: "frontier",
  visited: "besökt",
  free: "fri",
};

export function MazeGrid({ maze, step, algorithm, showValues = false, compact = false }: MazeGridProps) {
  const visited = new Set(step?.visited ?? []);
  const frontier = new Set(step?.frontier.map((e) => e.node) ?? []);
  const added = new Set([...(step?.addedNodes ?? []), ...(step?.updatedNodes ?? [])]);
  const path = new Set(step?.path ?? []);
  const current = step?.currentNode ?? null;

  const stateOf = (node: NodeId): CellState => {
    if (maze.walls[node]) return "wall";
    if (path.has(node)) return "path";
    if (node === current) return "current";
    if (frontier.has(node)) return "frontier";
    if (visited.has(node)) return "visited";
    return "free";
  };

  const valueOf = (node: NodeId): number | undefined => {
    if (!showValues || !step || !frontier.has(node)) return undefined;
    if (algorithm === "greedy") return step.hScore?.[node];
    if (algorithm === "astar") return step.fScore?.[node];
    return undefined;
  };

  const offset = compact ? 1 : 2;
  const cells: ReactNode[] = [];
  for (let node = 0; node < maze.rows * maze.cols; node++) {
    const { row, col } = toRowCol(maze, node);
    const state = stateOf(node);
    const isStart = node === maze.start;
    const isGoal = node === maze.goal;
    const value = valueOf(node);
    const role = isStart ? "start, " : isGoal ? "mål, " : "";
    cells.push(
      <div
        key={node}
        className={`cell cell-${state}${added.has(node) && state === "frontier" ? " cell-new" : ""}`}
        style={{ gridRow: row + offset, gridColumn: col + offset }}
        title={compact ? undefined : `${nodeLabel(maze, node)}: ${role}${STATE_LABEL[state]}`}
      >
        {isStart && <span className="cell-symbol">S</span>}
        {isGoal && <GoalFlag />}
        {!isStart && !isGoal && value !== undefined && <span className="cell-value">{value}</span>}
        {!isStart && !isGoal && state === "visited" && value === undefined && <span className="cell-dot" />}
      </div>,
    );
  }

  const pathPoints = step?.path
    ?.map((node) => {
      const { row, col } = toRowCol(maze, node);
      return `${col + 0.5},${row + 0.5}`;
    })
    .join(" ");

  return (
    <div className={`maze${compact ? " maze-compact" : ""}`} style={{ "--cols": maze.cols, "--rows": maze.rows } as CSSProperties}>
      <div
        className="maze-grid"
        role="img"
        aria-label={compact ? undefined : gridDescription(maze, step)}
        aria-hidden={compact || undefined}
        style={{
          gridTemplateColumns: `${compact ? "" : "var(--head) "}repeat(${maze.cols}, 1fr)`,
          gridTemplateRows: `${compact ? "" : "var(--head) "}repeat(${maze.rows}, auto)`,
        }}
      >
        {!compact &&
          Array.from({ length: maze.cols }, (_, col) => (
            <div key={`c${col}`} className="maze-head" style={{ gridRow: 1, gridColumn: col + 2 }} aria-hidden>
              {columnLetter(col)}
            </div>
          ))}
        {!compact &&
          Array.from({ length: maze.rows }, (_, row) => (
            <div key={`r${row}`} className="maze-head" style={{ gridRow: row + 2, gridColumn: 1 }} aria-hidden>
              {row + 1}
            </div>
          ))}
        {cells}
        {pathPoints && (
          <svg
            className="maze-path"
            style={{ gridRow: `${offset} / -1`, gridColumn: `${offset} / -1` }}
            viewBox={`0 0 ${maze.cols} ${maze.rows}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            <polyline points={pathPoints} />
          </svg>
        )}
      </div>
    </div>
  );
}

export function GoalFlag() {
  return (
    <svg className="cell-flag" viewBox="0 0 24 24" aria-hidden>
      <path d="M6 3v18" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M7 4h11l-3 4.5L18 13H7z" />
    </svg>
  );
}

function gridDescription(maze: Maze, step: SearchStep | null): string {
  const base = `Labyrint med ${maze.rows} rader och ${maze.cols} kolumner. Start i ${nodeLabel(maze, maze.start)}, mål i ${nodeLabel(maze, maze.goal)}.`;
  if (!step) return base;
  const current = step.currentNode !== null ? ` Aktuell nod: ${nodeLabel(maze, step.currentNode)}.` : "";
  const path = step.path ? ` Slutlig väg: ${step.path.length - 1} steg.` : "";
  return `${base} ${step.visited.length} besökta noder, ${step.frontier.length} i frontier.${current}${path}`;
}
