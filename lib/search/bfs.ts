import { makeStep, neighbors, reconstructPath } from "./common";
import type { Maze, NodeId, SearchGenerator } from "./types";

/**
 * BFS – bredden först-sökning.
 *
 * Frontier är en FIFO-kö: noden som lades in först tas ut först. Därför
 * undersöks alla noder på avstånd 1 innan noderna på avstånd 2, och så vidare.
 * I ett oviktat rutnät hittar BFS alltid en kortaste väg.
 *
 * En nod läggs bara i kön en gång: den markeras som "upptäckt" när den läggs in.
 */
export function* bfs(maze: Maze): SearchGenerator {
  const queue: NodeId[] = [maze.start];
  const discovered = new Set<NodeId>([maze.start]);
  const parentMap: Record<NodeId, NodeId> = {};
  const visited: NodeId[] = [];
  let maxFrontierSize = queue.length;
  let stepNumber = 0;

  const frontier = () => queue.map((node) => ({ node }));

  // Startläge: startnoden ligger ensam i kön.
  yield makeStep({
    stepNumber,
    currentNode: null,
    visited,
    frontier: frontier(),
    addedNodes: [maze.start],
    parentMap,
    maxFrontierSize,
  });

  while (queue.length > 0) {
    stepNumber++;

    // 1–2. Ta ut första noden i kön och markera den som besökt.
    const current = queue.shift()!;
    visited.push(current);

    if (current === maze.goal) {
      yield makeStep({
        stepNumber,
        currentNode: current,
        visited,
        frontier: frontier(),
        parentMap,
        path: reconstructPath(parentMap, maze.start, maze.goal),
        maxFrontierSize,
        finished: true,
        found: true,
      });
      return;
    }

    // 3–4. Lägg alla grannar som inte redan upptäckts sist i kön.
    const addedNodes: NodeId[] = [];
    for (const next of neighbors(maze, current)) {
      if (discovered.has(next)) continue;
      discovered.add(next);
      parentMap[next] = current;
      queue.push(next);
      addedNodes.push(next);
    }
    maxFrontierSize = Math.max(maxFrontierSize, queue.length);

    yield makeStep({
      stepNumber,
      currentNode: current,
      visited,
      frontier: frontier(),
      addedNodes,
      parentMap,
      maxFrontierSize,
    });
  }

  // Kön är tom: det finns ingen väg till målet.
  yield makeStep({
    stepNumber: stepNumber + 1,
    currentNode: null,
    visited,
    frontier: [],
    parentMap,
    maxFrontierSize,
    finished: true,
  });
}
