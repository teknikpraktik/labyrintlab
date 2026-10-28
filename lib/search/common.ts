import type { FrontierEntry, Maze, NodeId, SearchStep } from "./types";

/**
 * Grannordning: upp, höger, ned, vänster.
 *
 * Ordningen är fast och används av alla algoritmer. Den påverkar särskilt
 * DFS, som alltid försöker gå uppåt först, sedan höger, ned och sist vänster.
 * Ingen diagonal rörelse.
 */
export const NEIGHBOR_ORDER = [
  { name: "upp", dRow: -1, dCol: 0 },
  { name: "höger", dRow: 0, dCol: 1 },
  { name: "ned", dRow: 1, dCol: 0 },
  { name: "vänster", dRow: 0, dCol: -1 },
] as const;

export function toRowCol(maze: Maze, node: NodeId): { row: number; col: number } {
  return { row: Math.floor(node / maze.cols), col: node % maze.cols };
}

export function toNodeId(maze: Maze, row: number, col: number): NodeId {
  return row * maze.cols + col;
}

/** Fria grannar till en nod, i grannordningen upp, höger, ned, vänster. */
export function neighbors(maze: Maze, node: NodeId): NodeId[] {
  const { row, col } = toRowCol(maze, node);
  const result: NodeId[] = [];
  for (const { dRow, dCol } of NEIGHBOR_ORDER) {
    const r = row + dRow;
    const c = col + dCol;
    if (r < 0 || r >= maze.rows || c < 0 || c >= maze.cols) continue;
    const id = toNodeId(maze, r, c);
    if (!maze.walls[id]) result.push(id);
  }
  return result;
}

/** Manhattanavstånd: h = |x1 - x2| + |y1 - y2| (x = kolumn, y = rad). */
export function manhattan(maze: Maze, a: NodeId, b: NodeId): number {
  const pa = toRowCol(maze, a);
  const pb = toRowCol(maze, b);
  return Math.abs(pa.col - pb.col) + Math.abs(pa.row - pb.row);
}

/** Läsbar etikett för en ruta, t.ex. "C4" (kolumnbokstav + radnummer). */
export function nodeLabel(maze: Maze, node: NodeId): string {
  const { row, col } = toRowCol(maze, node);
  return `${columnLetter(col)}${row + 1}`;
}

export function columnLetter(col: number): string {
  return String.fromCharCode(65 + col);
}

/** Följer föräldrapekarna bakåt från målet och returnerar vägen start → mål. */
export function reconstructPath(
  parentMap: Record<NodeId, NodeId>,
  start: NodeId,
  goal: NodeId,
): NodeId[] {
  const path = [goal];
  let node = goal;
  while (node !== start) {
    node = parentMap[node];
    path.push(node);
  }
  return path.reverse();
}

/** Väglängd = antal förflyttningar, dvs. antal rutor i vägen minus ett. */
export function pathLength(path: NodeId[] | null): number | null {
  return path ? path.length - 1 : null;
}

/**
 * Enkel prioritetskö som håller posterna sorterade.
 *
 * Nya poster placeras efter alla poster med samma prioritet, så vid lika
 * prioritet tas den som lades in först ut först. Labyrinterna är små, så en
 * sorterad lista är fullt tillräcklig och lätt att visa för eleven.
 */
export class PriorityQueue<T> {
  private items: T[] = [];

  constructor(private compare: (a: T, b: T) => number) {}

  push(item: T): void {
    let i = this.items.length;
    while (i > 0 && this.compare(this.items[i - 1], item) > 0) i--;
    this.items.splice(i, 0, item);
  }

  pop(): T | undefined {
    return this.items.shift();
  }

  remove(predicate: (item: T) => boolean): void {
    this.items = this.items.filter((item) => !predicate(item));
  }

  find(predicate: (item: T) => boolean): T | undefined {
    return this.items.find(predicate);
  }

  get size(): number {
    return this.items.length;
  }

  toArray(): T[] {
    return [...this.items];
  }
}

interface StepInput {
  stepNumber: number;
  currentNode: NodeId | null;
  visited: NodeId[];
  frontier: FrontierEntry[];
  addedNodes?: NodeId[];
  updatedNodes?: NodeId[];
  parentMap: Record<NodeId, NodeId>;
  gScore?: Record<NodeId, number>;
  hScore?: Record<NodeId, number>;
  fScore?: Record<NodeId, number>;
  path?: NodeId[] | null;
  maxFrontierSize: number;
  finished?: boolean;
  found?: boolean;
}

/**
 * Skapar ett ögonblicksfoto. Allt kopieras så att visualiseringen aldrig ser
 * algoritmens interna, föränderliga datastrukturer.
 */
export function makeStep(input: StepInput): SearchStep {
  return {
    stepNumber: input.stepNumber,
    currentNode: input.currentNode,
    visited: [...input.visited],
    frontier: input.frontier.map((entry) => ({ ...entry })),
    addedNodes: [...(input.addedNodes ?? [])],
    updatedNodes: [...(input.updatedNodes ?? [])],
    parentMap: { ...input.parentMap },
    gScore: input.gScore ? { ...input.gScore } : undefined,
    hScore: input.hScore ? { ...input.hScore } : undefined,
    fScore: input.fScore ? { ...input.fScore } : undefined,
    path: input.path ? [...input.path] : null,
    maxFrontierSize: input.maxFrontierSize,
    finished: input.finished ?? false,
    found: input.found ?? false,
  };
}
