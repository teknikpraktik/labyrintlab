import { makeStep, manhattan, neighbors, PriorityQueue, reconstructPath } from "./common";
import type { Maze, NodeId, SearchGenerator } from "./types";

interface GreedyEntry {
  node: NodeId;
  h: number;
}

/**
 * Greedy Best-First Search – girig bäst först-sökning.
 *
 * Frontier är en prioritetskö sorterad på enbart heuristiken h(n), här
 * Manhattanavståndet till målet. Algoritmen tar alltid ut den nod som *verkar*
 * ligga närmast målet, utan att bry sig om hur lång väg som redan har gåtts.
 * Den är ofta snabb, men kan luras och hittar inte alltid kortaste vägen.
 *
 * Vid lika h tas den nod ut som lades in först.
 * En nod läggs bara i prioritetskön en gång.
 */
export function* greedy(maze: Maze): SearchGenerator {
  const queue = new PriorityQueue<GreedyEntry>((a, b) => a.h - b.h);
  const discovered = new Set<NodeId>([maze.start]);
  const parentMap: Record<NodeId, NodeId> = {};
  const hScore: Record<NodeId, number> = {};
  const visited: NodeId[] = [];
  let stepNumber = 0;

  hScore[maze.start] = manhattan(maze, maze.start, maze.goal);
  queue.push({ node: maze.start, h: hScore[maze.start] });
  let maxFrontierSize = queue.size;

  const frontier = () => queue.toArray().map(({ node, h }) => ({ node, h }));

  yield makeStep({
    stepNumber,
    currentNode: null,
    visited,
    frontier: frontier(),
    addedNodes: [maze.start],
    parentMap,
    hScore,
    maxFrontierSize,
  });

  while (queue.size > 0) {
    stepNumber++;

    // 1–2. Ta ut noden med lägst h och markera den som besökt.
    const { node: current } = queue.pop()!;
    visited.push(current);

    if (current === maze.goal) {
      yield makeStep({
        stepNumber,
        currentNode: current,
        visited,
        frontier: frontier(),
        parentMap,
        hScore,
        path: reconstructPath(parentMap, maze.start, maze.goal),
        maxFrontierSize,
        finished: true,
        found: true,
      });
      return;
    }

    // 3–4. Beräkna h för nya grannar och lägg dem i prioritetskön.
    const addedNodes: NodeId[] = [];
    for (const next of neighbors(maze, current)) {
      if (discovered.has(next)) continue;
      discovered.add(next);
      parentMap[next] = current;
      hScore[next] = manhattan(maze, next, maze.goal);
      queue.push({ node: next, h: hScore[next] });
      addedNodes.push(next);
    }
    maxFrontierSize = Math.max(maxFrontierSize, queue.size);

    yield makeStep({
      stepNumber,
      currentNode: current,
      visited,
      frontier: frontier(),
      addedNodes,
      parentMap,
      hScore,
      maxFrontierSize,
    });
  }

  yield makeStep({
    stepNumber: stepNumber + 1,
    currentNode: null,
    visited,
    frontier: [],
    parentMap,
    hScore,
    maxFrontierSize,
    finished: true,
  });
}
