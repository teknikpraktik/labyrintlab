import { describe, expect, test } from "vitest";
import { FIXED_MAZE_IDS, MAZES, createCustomMaze, withEndpoint, withWall } from "../lib/mazes";
import { ALGORITHMS, ALGORITHM_IDS, runToEnd, shortestPathLength, toRunResult } from "../lib/search";
import { manhattan, neighbors, PriorityQueue } from "../lib/search/common";
import { randomSearch } from "../lib/search/random";
import type { Maze, NodeId } from "../lib/search/types";

function expectValidPath(maze: Maze, path: NodeId[] | null) {
  expect(path).not.toBeNull();
  const p = path!;
  expect(p[0]).toBe(maze.start);
  expect(p[p.length - 1]).toBe(maze.goal);
  for (let i = 1; i < p.length; i++) {
    expect(neighbors(maze, p[i - 1])).toContain(p[i]);
  }
}

describe.each(FIXED_MAZE_IDS)("bana %s", (mazeId) => {
  const maze = MAZES[mazeId];
  const optimal = shortestPathLength(maze);

  test.each(ALGORITHM_IDS)("%s hittar en giltig väg till målet", (algorithm) => {
    const last = runToEnd(algorithm, maze);
    expect(last.finished).toBe(true);
    expect(last.found).toBe(true);
    expectValidPath(maze, last.path);
  });

  test("BFS och A* hittar kortaste vägen", () => {
    expect(toRunResult("bfs", runToEnd("bfs", maze), optimal).isShortest).toBe(true);
    expect(toRunResult("astar", runToEnd("astar", maze), optimal).isShortest).toBe(true);
  });

  test("A* besöker färre noder än BFS", () => {
    expect(runToEnd("astar", maze).visited.length).toBeLessThan(runToEnd("bfs", maze).visited.length);
  });

  test.each(ALGORITHM_IDS)("%s tar ut exakt en nod per steg och har en giltig frontier", (algorithm) => {
    const steps = [...ALGORITHMS[algorithm].run(maze)];
    expect(steps[0].stepNumber).toBe(0);
    expect(steps[0].frontier.map((e) => e.node)).toEqual([maze.start]);
    steps.forEach((step, i) => {
      expect(step.stepNumber).toBe(i);
      expect(step.visited.length).toBe(i);
      if (i > 0) expect(step.currentNode).toBe(step.visited[i - 1]);
      const nodes = step.frontier.map((e) => e.node);
      expect(new Set(nodes).size).toBe(nodes.length);
      for (const n of nodes) expect(step.visited).not.toContain(n);
      expect(step.maxFrontierSize).toBeGreaterThanOrEqual(nodes.length);
      expect(step.finished).toBe(i === steps.length - 1);
    });
  });
});

describe("Fallgropen", () => {
  const maze = MAZES.fallgrop;
  const optimal = shortestPathLength(maze);

  test("Greedy blir lurad och hittar inte kortaste vägen", () => {
    expect(toRunResult("greedy", runToEnd("greedy", maze), optimal).isShortest).toBe(false);
  });

  test("DFS hittar inte kortaste vägen", () => {
    expect(toRunResult("dfs", runToEnd("dfs", maze), optimal).isShortest).toBe(false);
  });
});

describe("Återvändsgränden", () => {
  const maze = MAZES.atervand;
  const deadEnd = 5 * maze.cols + 10; // K6, korridorens slut

  test.each(["dfs", "greedy", "astar"] as const)("%s går in i återvändsgränden", (algorithm) => {
    expect(runToEnd(algorithm, maze).visited).toContain(deadEnd);
  });

  test("DFS hittar inte kortaste vägen", () => {
    expect(toRunResult("dfs", runToEnd("dfs", maze), shortestPathLength(maze)).isShortest).toBe(false);
  });
});

describe("Egen bana", () => {
  test("en tom egen bana har en väg mellan start och mål", () => {
    const maze = createCustomMaze();
    expect(shortestPathLength(maze)).toBe(manhattan(maze, maze.start, maze.goal));
  });

  test("start och mål kan inte bli väggar, och väggar under ny start tas bort", () => {
    let maze = createCustomMaze();
    expect(withWall(maze, maze.start, true)).toBe(maze);
    maze = withWall(maze, 0, true);
    maze = withEndpoint(maze, "start", 0);
    expect(maze.start).toBe(0);
    expect(maze.walls[0]).toBe(false);
  });

  test.each(ALGORITHM_IDS)("%s ger upp utan väg när målet är instängt", (algorithm) => {
    let maze = createCustomMaze();
    for (const n of neighbors(maze, maze.goal)) maze = withWall(maze, n, true);
    expect(shortestPathLength(maze)).toBeNull();
    const last = runToEnd(algorithm, maze);
    expect(last.finished).toBe(true);
    expect(last.found).toBe(false);
    expect(last.path).toBeNull();
  });

  test("en kopia av en fast bana ger samma resultat", () => {
    const copy = createCustomMaze(MAZES.fallgrop);
    expect(runToEnd("astar", copy).visited).toEqual(runToEnd("astar", MAZES.fallgrop).visited);
  });
});

describe("Grundbanan", () => {
  test("Greedy hittar en kort väg med få besökta noder", () => {
    const maze = MAZES.grund;
    const greedy = runToEnd("greedy", maze);
    expect(greedy.path!.length - 1).toBe(shortestPathLength(maze));
    expect(greedy.visited.length).toBeLessThan(runToEnd("bfs", maze).visited.length);
  });
});

describe("Slump", () => {
  /** Enkel deterministisk slumptalsgenerator för reproducerbara tester. */
  const seeded = (seed: number) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const run = (seed: number) => [...randomSearch(MAZES.grund, seeded(seed))].at(-1)!;

  test("samma frö ger samma sökning", () => {
    expect(run(1).visited).toEqual(run(1).visited);
  });

  test("olika frön ger olika sökningar", () => {
    const orders = new Set([1, 2, 3, 4, 5].map((seed) => run(seed).visited.join(",")));
    expect(orders.size).toBeGreaterThan(1);
  });

  test.each([1, 2, 3, 4, 5])("hittar alltid en giltig väg (frö %i)", (seed) => {
    const last = run(seed);
    expect(last.found).toBe(true);
    expectValidPath(MAZES.grund, last.path);
  });

  test("slumpen följer ingen ordning – den är sällan bättre än A*", () => {
    const astarVisited = runToEnd("astar", MAZES.grund).visited.length;
    const better = [1, 2, 3, 4, 5, 6, 7, 8].filter((seed) => run(seed).visited.length < astarVisited);
    expect(better.length).toBeLessThan(4);
  });
});

describe("hjälpfunktioner", () => {
  test("grannordningen är upp, höger, ned, vänster", () => {
    const maze = { ...MAZES.grund, walls: MAZES.grund.walls.map(() => false) };
    const center = 5 * maze.cols + 5;
    expect(neighbors(maze, center)).toEqual([center - maze.cols, center + 1, center + maze.cols, center - 1]);
  });

  test("DFS undersöker grannen uppåt först", () => {
    const maze = { ...MAZES.grund, walls: MAZES.grund.walls.map(() => false) };
    const steps = [...ALGORITHMS.dfs.run(maze)];
    expect(steps[2].currentNode).toBe(maze.start - maze.cols);
  });

  test("Manhattanavstånd", () => {
    const maze = MAZES.grund;
    expect(manhattan(maze, maze.start, maze.goal)).toBe(12 + 8);
  });

  test("prioritetskön tar ut först inlagd vid lika prioritet", () => {
    const pq = new PriorityQueue<{ id: string; p: number }>((a, b) => a.p - b.p);
    pq.push({ id: "a", p: 2 });
    pq.push({ id: "b", p: 1 });
    pq.push({ id: "c", p: 2 });
    pq.push({ id: "d", p: 1 });
    expect(pq.toArray().map((x) => x.id)).toEqual(["b", "d", "a", "c"]);
  });
});
