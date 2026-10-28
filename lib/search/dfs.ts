import { makeStep, neighbors, reconstructPath } from "./common";
import type { Maze, NodeId, SearchGenerator } from "./types";

/**
 * DFS – djupet först-sökning.
 *
 * Frontier är en LIFO-stack: noden som lades in sist tas ut först. Sökningen
 * följer därför en gren så djupt som möjligt innan den backar.
 *
 * Grannarna läggs på stacken i omvänd grannordning (vänster, ned, höger, upp),
 * så att "upp" hamnar överst och undersöks först. DFS försöker alltså alltid
 * gå uppåt, sedan höger, sedan ned och sist vänster.
 *
 * Om en granne redan ligger i stacken flyttas den till toppen och får den
 * aktuella noden som ny förälder. Då innehåller stacken aldrig dubbletter,
 * och sökningen blir en äkta djupet först-sökning.
 */
export function* dfs(maze: Maze): SearchGenerator {
  // Toppen av stacken är sista elementet i arrayen.
  const stack: NodeId[] = [maze.start];
  const expanded = new Set<NodeId>();
  const parentMap: Record<NodeId, NodeId> = {};
  const visited: NodeId[] = [];
  let maxFrontierSize = stack.length;
  let stepNumber = 0;

  // Visa stacken med toppen först, eftersom det är den som tas ut härnäst.
  const frontier = () => [...stack].reverse().map((node) => ({ node }));

  yield makeStep({
    stepNumber,
    currentNode: null,
    visited,
    frontier: frontier(),
    addedNodes: [maze.start],
    parentMap,
    maxFrontierSize,
  });

  while (stack.length > 0) {
    stepNumber++;

    // 1–2. Ta ut noden överst på stacken och markera den som besökt.
    const current = stack.pop()!;
    expanded.add(current);
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

    // 3–4. Lägg obesökta grannar överst på stacken, i omvänd grannordning.
    const candidates = neighbors(maze, current).filter((n) => !expanded.has(n));
    const addedNodes: NodeId[] = [];
    const updatedNodes: NodeId[] = [];
    for (const next of [...candidates].reverse()) {
      const index = stack.indexOf(next);
      if (index !== -1) {
        stack.splice(index, 1);
        updatedNodes.push(next);
      } else {
        addedNodes.push(next);
      }
      parentMap[next] = current;
      stack.push(next);
    }
    maxFrontierSize = Math.max(maxFrontierSize, stack.length);

    yield makeStep({
      stepNumber,
      currentNode: current,
      visited,
      frontier: frontier(),
      // Rapportera i grannordning (upp först) så att texten blir lätt att följa.
      addedNodes: addedNodes.reverse(),
      updatedNodes: updatedNodes.reverse(),
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
