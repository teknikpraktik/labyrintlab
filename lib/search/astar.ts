import { makeStep, manhattan, neighbors, PriorityQueue, reconstructPath } from "./common";
import type { Maze, NodeId, SearchGenerator } from "./types";

interface AStarEntry {
  node: NodeId;
  g: number;
  h: number;
  f: number;
}

/**
 * A* – "A-stjärna".
 *
 * Frontier är en prioritetskö sorterad på f(n) = g(n) + h(n), där
 *  - g(n) är den faktiska kostnaden (antal steg) från start till n
 *  - h(n) är Manhattanavståndet från n till målet.
 *
 * Till skillnad från Greedy tar A* hänsyn till hur lång väg som redan gåtts.
 * Eftersom Manhattanavståndet aldrig överskattar det verkliga avståndet hittar
 * A* alltid en kortaste väg.
 *
 * Vid lika f tas noden med lägst h ut först (den som verkar närmast målet),
 * och vid lika f och h den som lades in först.
 */
export function* astar(maze: Maze): SearchGenerator {
  const open = new PriorityQueue<AStarEntry>((a, b) => a.f - b.f || a.h - b.h);
  const closed = new Set<NodeId>();
  const parentMap: Record<NodeId, NodeId> = {};
  const gScore: Record<NodeId, number> = {};
  const hScore: Record<NodeId, number> = {};
  const fScore: Record<NodeId, number> = {};
  const visited: NodeId[] = [];
  let stepNumber = 0;

  const add = (node: NodeId, g: number) => {
    gScore[node] = g;
    hScore[node] = manhattan(maze, node, maze.goal);
    fScore[node] = g + hScore[node];
    open.push({ node, g, h: hScore[node], f: fScore[node] });
  };

  add(maze.start, 0);
  let maxFrontierSize = open.size;

  const frontier = () => open.toArray().map(({ node, g, h, f }) => ({ node, g, h, f }));

  yield makeStep({
    stepNumber,
    currentNode: null,
    visited,
    frontier: frontier(),
    addedNodes: [maze.start],
    parentMap,
    gScore,
    hScore,
    fScore,
    maxFrontierSize,
  });

  while (open.size > 0) {
    stepNumber++;

    // 1–2. Ta ut noden med lägst f och markera den som besökt.
    const { node: current } = open.pop()!;
    closed.add(current);
    visited.push(current);

    if (current === maze.goal) {
      yield makeStep({
        stepNumber,
        currentNode: current,
        visited,
        frontier: frontier(),
        parentMap,
        gScore,
        hScore,
        fScore,
        path: reconstructPath(parentMap, maze.start, maze.goal),
        maxFrontierSize,
        finished: true,
        found: true,
      });
      return;
    }

    // 3–4. Undersök grannarna. Nya grannar läggs in; om vi hittat en kortare
    // väg till en granne som redan ligger i kön uppdateras dess g och f.
    const addedNodes: NodeId[] = [];
    const updatedNodes: NodeId[] = [];
    const g = gScore[current] + 1;
    for (const next of neighbors(maze, current)) {
      if (closed.has(next)) continue;
      const existing = open.find((entry) => entry.node === next);
      if (!existing) {
        parentMap[next] = current;
        add(next, g);
        addedNodes.push(next);
      } else if (g < existing.g) {
        open.remove((entry) => entry.node === next);
        parentMap[next] = current;
        add(next, g);
        updatedNodes.push(next);
      }
    }
    maxFrontierSize = Math.max(maxFrontierSize, open.size);

    yield makeStep({
      stepNumber,
      currentNode: current,
      visited,
      frontier: frontier(),
      addedNodes,
      updatedNodes,
      parentMap,
      gScore,
      hScore,
      fScore,
      maxFrontierSize,
    });
  }

  yield makeStep({
    stepNumber: stepNumber + 1,
    currentNode: null,
    visited,
    frontier: [],
    parentMap,
    gScore,
    hScore,
    fScore,
    maxFrontierSize,
    finished: true,
  });
}
