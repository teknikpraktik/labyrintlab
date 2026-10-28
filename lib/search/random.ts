import { makeStep, neighbors, reconstructPath } from "./common";
import type { Maze, NodeId, SearchGenerator } from "./types";

/**
 * Slumpmässig sökning.
 *
 * Frontier är en vanlig lista utan ordning. I varje steg lottas en av noderna
 * i listan fram och undersöks. Det finns alltså ingen strategi alls – varken
 * "närmast först" (BFS), "djupast först" (DFS) eller "närmast målet" (Greedy).
 *
 * Algoritmen hittar fram om det finns en väg, men vägen blir oftast inte den
 * kortaste, och resultatet blir olika för varje körning. Den fungerar som en
 * referenspunkt: hur mycket bättre är de andra algoritmerna än slumpen?
 *
 * En nod läggs bara i listan en gång: den markeras som "upptäckt" när den läggs in.
 *
 * @param random slumptalsgenerator som ger tal i [0, 1). Kan bytas ut i tester.
 */
export function* randomSearch(maze: Maze, random: () => number = Math.random): SearchGenerator {
  const list: NodeId[] = [maze.start];
  const discovered = new Set<NodeId>([maze.start]);
  const parentMap: Record<NodeId, NodeId> = {};
  const visited: NodeId[] = [];
  let maxFrontierSize = list.length;
  let stepNumber = 0;

  // Listan visas i den ordning noderna lades in – ordningen spelar ingen roll.
  const frontier = () => list.map((node) => ({ node }));

  yield makeStep({
    stepNumber,
    currentNode: null,
    visited,
    frontier: frontier(),
    addedNodes: [maze.start],
    parentMap,
    maxFrontierSize,
  });

  while (list.length > 0) {
    stepNumber++;

    // 1–2. Lotta fram en nod ur listan och markera den som besökt.
    const index = Math.floor(random() * list.length);
    const [current] = list.splice(index, 1);
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

    // 3–4. Lägg alla grannar som inte redan upptäckts i listan.
    const addedNodes: NodeId[] = [];
    for (const next of neighbors(maze, current)) {
      if (discovered.has(next)) continue;
      discovered.add(next);
      parentMap[next] = current;
      list.push(next);
      addedNodes.push(next);
    }
    maxFrontierSize = Math.max(maxFrontierSize, list.length);

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
