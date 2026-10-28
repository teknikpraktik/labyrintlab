import { astar } from "./astar";
import { bfs } from "./bfs";
import { pathLength } from "./common";
import { dfs } from "./dfs";
import { greedy } from "./greedy";
import type { AlgorithmId, Maze, SearchFunction, SearchStep } from "./types";

export interface AlgorithmInfo {
  id: AlgorithmId;
  name: string;
  fullName: string;
  kind: "Oinformerad" | "Informerad";
  /** Namnet på datastrukturen som används som frontier. */
  structure: string;
  /** Bestämd form, t.ex. "kön" eller "stacken". */
  structureDefinite: string;
  structureHint: string;
  /** Vad algoritmen väljer nästa nod efter. */
  priority: string | null;
  description: string;
  run: SearchFunction;
}

export const ALGORITHMS: Record<AlgorithmId, AlgorithmInfo> = {
  bfs: {
    id: "bfs",
    name: "BFS",
    fullName: "Bredden först-sökning",
    kind: "Oinformerad",
    structure: "Kö",
    structureDefinite: "kön",
    structureHint: "FIFO – först in, först ut. Nya noder läggs sist, nästa nod tas från början.",
    priority: null,
    description:
      "Undersöker alla noder på samma avstånd innan sökningen går vidare. Använder en kö.",
    run: bfs,
  },
  dfs: {
    id: "dfs",
    name: "DFS",
    fullName: "Djupet först-sökning",
    kind: "Oinformerad",
    structure: "Stack",
    structureDefinite: "stacken",
    structureHint: "LIFO – sist in, först ut. Nya noder läggs överst, nästa nod tas från toppen.",
    priority: null,
    description: "Följer en väg så långt som möjligt innan den backar. Använder en stack.",
    run: dfs,
  },
  greedy: {
    id: "greedy",
    name: "Greedy",
    fullName: "Greedy Best-First Search",
    kind: "Informerad",
    structure: "Prioritetskö",
    structureDefinite: "prioritetskön",
    structureHint: "Sorterad på h – lägst h (närmast målet enligt Manhattanavstånd) tas ut först.",
    priority: "h",
    description:
      "Väljer den nod som verkar ligga närmast målet. Tar inte hänsyn till hur lång väg som redan gåtts.",
    run: greedy,
  },
  astar: {
    id: "astar",
    name: "A*",
    fullName: "A-stjärna",
    kind: "Informerad",
    structure: "Prioritetskö",
    structureDefinite: "prioritetskön",
    structureHint: "Sorterad på f = g + h – lägst f tas ut först. Vid lika f väljs lägst h.",
    priority: "f",
    description:
      "Väger samman kostnaden hittills med en uppskattning av hur långt det är kvar till målet.",
    run: astar,
  },
};

export const ALGORITHM_IDS: AlgorithmId[] = ["bfs", "dfs", "greedy", "astar"];

/** Kör en algoritm till slut och returnerar sista steget. */
export function runToEnd(algorithm: AlgorithmId, maze: Maze): SearchStep {
  let last: SearchStep | undefined;
  for (const step of ALGORITHMS[algorithm].run(maze)) last = step;
  return last!;
}

/** Kortaste möjliga väglängd i labyrinten, beräknad internt med BFS. */
export function shortestPathLength(maze: Maze): number | null {
  return pathLength(runToEnd("bfs", maze).path);
}

export interface RunResult {
  algorithm: AlgorithmId;
  visitedCount: number;
  pathLength: number | null;
  maxFrontierSize: number;
  /** Vägen har samma längd som den kortaste möjliga vägen i banan. */
  isShortest: boolean;
}

export function toRunResult(algorithm: AlgorithmId, step: SearchStep, optimal: number | null): RunResult {
  const length = pathLength(step.path);
  return {
    algorithm,
    visitedCount: step.visited.length,
    pathLength: length,
    maxFrontierSize: step.maxFrontierSize,
    isShortest: length !== null && length === optimal,
  };
}

export type { AlgorithmId, FrontierEntry, Maze, MazeId, NodeId, SearchStep } from "./types";
