/**
 * Gemensamma typer för labyrinter och sökalgoritmer.
 *
 * En nod (ruta) identifieras med ett heltal: id = rad * antalKolumner + kolumn.
 * Det gör det enkelt att använda noder som nycklar i Set, Map och objekt.
 */

export type NodeId = number;

export type AlgorithmId = "bfs" | "dfs" | "greedy" | "astar";

export type MazeId = "grund" | "fallgrop";

export interface Maze {
  id: MazeId;
  name: string;
  /** Kort beskrivning som visas för eleven. */
  description: string;
  rows: number;
  cols: number;
  /** walls[id] === true betyder att rutan är en vägg. */
  walls: boolean[];
  start: NodeId;
  goal: NodeId;
}

/** En post i algoritmens frontier (kö, stack eller prioritetskö). */
export interface FrontierEntry {
  node: NodeId;
  /** Faktisk kostnad från start (används av A*). */
  g?: number;
  /** Heuristik: Manhattanavstånd till målet (Greedy och A*). */
  h?: number;
  /** f = g + h (A*). */
  f?: number;
}

/**
 * Ett ögonblicksfoto av sökningen efter ett logiskt steg.
 *
 * Varje algoritm är en generator som levererar ett SearchStep per iteration:
 *  1. ta nästa nod ur frontier
 *  2. markera den som aktuell/besökt
 *  3. undersök dess grannar
 *  4. lägg relevanta grannar i frontier
 *
 * Visualiseringen läser bara dessa steg – den innehåller ingen algoritmlogik.
 */
export interface SearchStep {
  /** 0 = startläget (startnoden ligger i frontier), 1 = första uttaget osv. */
  stepNumber: number;
  /** Noden som togs ut ur frontier i detta steg (null i startläget). */
  currentNode: NodeId | null;
  /** Besökta/utforskade noder i den ordning de togs ut ur frontier. */
  visited: NodeId[];
  /** Frontier i uttagsordning: första posten är den som tas ut härnäst. */
  frontier: FrontierEntry[];
  /** Noder som lades till i frontier i detta steg. */
  addedNodes: NodeId[];
  /**
   * Noder som redan låg i frontier men fick ny plats/värde i detta steg
   * (DFS flyttar dem till toppen av stacken, A* kan hitta ett lägre g).
   */
  updatedNodes: NodeId[];
  /** Förälder till varje upptäckt nod – används för att följa vägen bakåt. */
  parentMap: Record<NodeId, NodeId>;
  gScore?: Record<NodeId, number>;
  hScore?: Record<NodeId, number>;
  fScore?: Record<NodeId, number>;
  /** Den slutliga vägen från start till mål (endast när målet hittats). */
  path: NodeId[] | null;
  /** Största storlek frontier haft hittills. */
  maxFrontierSize: number;
  finished: boolean;
  found: boolean;
}

export type SearchGenerator = Generator<SearchStep, void, undefined>;

export type SearchFunction = (maze: Maze) => SearchGenerator;
