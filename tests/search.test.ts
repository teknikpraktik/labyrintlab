import { describe, expect, test } from "vitest";
import { MAZES, MAZE_IDS } from "../lib/mazes";
import { ALGORITHMS, ALGORITHM_IDS, runToEnd, shortestPathLength, toRunResult } from "../lib/search";
import { manhattan, neighbors, PriorityQueue } from "../lib/search/common";
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

describe.each(MAZE_IDS)("bana %s", (mazeId) => {
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

describe("Grundbanan", () => {
  test("Greedy hittar en kort väg med få besökta noder", () => {
    const maze = MAZES.grund;
    const greedy = runToEnd("greedy", maze);
    expect(greedy.path!.length - 1).toBe(shortestPathLength(maze));
    expect(greedy.visited.length).toBeLessThan(runToEnd("bfs", maze).visited.length);
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
