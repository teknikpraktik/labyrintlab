import type { FixedMazeId, Maze, MazeId, NodeId } from "./search/types";

/**
 * De två fasta banorna i LabyrintLab.
 *
 * Banorna ritas som text:  "#" = vägg, "." = fri ruta, "S" = start, "M" = mål.
 * Kolumner betecknas A, B, C … och rader 1, 2, 3 … i gränssnittet.
 *
 * Att det bara finns ett fåtal banor är ett medvetet pedagogiskt val: fokus
 * ska ligga på att jämföra algoritmerna på *samma* problem, inte på många banor.
 * Utöver de fasta banorna kan eleven rita en egen bana (Bana 4).
 */

interface MazeDefinition {
  id: MazeId;
  name: string;
  description: string;
  layout: string[];
}

/**
 * Bana 1: Grundbanan
 *
 * Pedagogiskt syfte:
 *  - Alla fyra algoritmer hittar målet.
 *  - Banan är ganska öppen, så BFS:s utbredning "lager för lager" syns tydligt.
 *  - DFS (som alltid försöker uppåt och sedan åt höger) drar iväg längs
 *    kanterna och ger en lång, slingrig väg – djupsökningen blir tydlig.
 *  - Målet ligger ungefär i den riktning som Manhattanavståndet pekar, så
 *    Greedy och A* går en relativt intuitiv väg mot målet. Här är heuristiken
 *    till hjälp och de informerade algoritmerna besöker få noder.
 */
const GRUNDBANAN: MazeDefinition = {
  id: "grund",
  name: "Bana 1: Grundbanan",
  description: "En öppen labyrint där alla algoritmer hittar fram. Bra för en första jämförelse.",
  layout: [
    "...............",
    ".S....#........",
    ".###..#..####..",
    "...#..#.....#..",
    ".#.#....##..#..",
    ".#...#......#..",
    ".###.#.###.....",
    ".....#...#..##.",
    ".#####.#.#.....",
    ".......#...#.M.",
    "...............",
  ],
};

/**
 * Bana 2: Fallgropen
 *
 * Pedagogiskt syfte:
 *  - Från start leder en korridor rakt mot målet (rad 6). Enligt
 *    Manhattanavståndet ser den lovande ut, men den slutar i en återvändsgränd
 *    vid väggen och fortsätter som en lång omväg uppåt, tillbaka åt vänster och
 *    runt via översta raden.
 *  - Greedy lockas in i korridoren eftersom h hela tiden ser bra ut, och
 *    följer sedan omvägen ända fram: målet hittas, men vägen blir lång.
 *  - Den kortaste vägen går först *nedåt*, bort från målet, och sedan rakt
 *    åt höger längs den nedre delen av banan.
 *  - A* väger in g (vägen hittills). När omvägen blir dyr byter A* till den
 *    nedre vägen och hittar kortaste vägen med relativt få besökta noder.
 *  - BFS hittar också kortaste vägen, men undersöker många fler noder,
 *    bland annat hela rummet uppe till vänster och det öppna fältet nedtill.
 *  - DFS försöker uppåt först och fastnar därför först i rummet uppe till
 *    vänster (en återvändsgränd), och tar sedan den långa omvägen.
 */
const FALLGROPEN: MazeDefinition = {
  id: "fallgrop",
  name: "Bana 2: Fallgropen",
  description:
    "Vägen som ser närmast ut är inte alltid den bästa. Vilka algoritmer går i fällan?",
  layout: [
    "....#..........",
    "....#.########.",
    "....#.....####.",
    "....#####.####.",
    ".########.####.",
    "S.........####M",
    ".#############.",
    "...............",
    "..#...#...#..#.",
    "...............",
  ],
};

/**
 * Bana 3: Återvändsgränden
 *
 * Pedagogiskt syfte:
 *  - Från start går en lång korridor rakt mot målet – men den är stängd i
 *    slutet. Den enda vägen ut ur korridoren är en öppning nedåt nära start.
 *  - Greedy rusar in i korridoren (h minskar hela tiden), når återvändsgränden
 *    och måste sedan backa. Den hittar till slut en kort väg, men har slösat
 *    många besök på korridoren.
 *  - Även A* går in i korridoren: Manhattanavståndet "ser" inte väggar, så
 *    korridoren ser billig ut (f = 14) ända tills den tar slut. Bra
 *    diskussionsfråga: en heuristik är bara en uppskattning.
 *  - DFS (upp, höger, ned, vänster) går först hela vägen in i
 *    återvändsgränden, backar, och tar sedan en lång omväg via övre delen.
 *  - BFS hittar kortaste vägen men breder ut sig över nästan hela banan.
 */
const ATERVANDSGRANDEN: MazeDefinition = {
  id: "atervand",
  name: "Bana 3: Återvändsgränden",
  description: "En korridor pekar rakt mot målet – men tar slut. Vilka algoritmer går in, och hur tar de sig ut?",
  layout: [
    "...............",
    ".#...#...#...#.",
    "...............",
    "...............",
    "#############..",
    "S..........##.M",
    "##.##########..",
    "...............",
    ".#...#...#...#.",
    "...............",
    "...............",
  ],
};

function parseMaze(def: MazeDefinition): Maze {
  const rows = def.layout.length;
  const cols = def.layout[0].length;
  const walls: boolean[] = [];
  let start = -1;
  let goal = -1;

  def.layout.forEach((line, row) => {
    if (line.length !== cols) {
      throw new Error(`${def.name}: rad ${row + 1} har fel längd`);
    }
    [...line].forEach((char, col) => {
      const id = row * cols + col;
      walls.push(char === "#");
      if (char === "S") start = id;
      if (char === "M") goal = id;
    });
  });

  if (start === -1 || goal === -1) {
    throw new Error(`${def.name}: start eller mål saknas`);
  }

  return { id: def.id, name: def.name, description: def.description, rows, cols, walls, start, goal };
}

export const MAZES: Record<FixedMazeId, Maze> = {
  grund: parseMaze(GRUNDBANAN),
  fallgrop: parseMaze(FALLGROPEN),
  atervand: parseMaze(ATERVANDSGRANDEN),
};

export const FIXED_MAZE_IDS: FixedMazeId[] = ["grund", "fallgrop", "atervand"];

export const MAZE_IDS: MazeId[] = [...FIXED_MAZE_IDS, "egen"];

export const CUSTOM_MAZE_NAME = "Bana 4: Egen bana";

/**
 * Bana 4: Egen bana
 *
 * Eleven ritar väggar och flyttar start och mål. Banan har samma storlek som
 * de fasta banorna och körs med exakt samma algoritmer och visualisering.
 * Den sparas bara i minnet under sessionen.
 */
export function createCustomMaze(template?: Maze): Maze {
  const rows = template?.rows ?? 11;
  const cols = template?.cols ?? 15;
  return {
    id: "egen",
    name: CUSTOM_MAZE_NAME,
    description: "Rita väggar och flytta start och mål. Kör sedan algoritmerna på din egen bana.",
    rows,
    cols,
    walls: template ? [...template.walls] : new Array(rows * cols).fill(false),
    start: template?.start ?? 5 * cols + 1,
    goal: template?.goal ?? 5 * cols + (cols - 2),
  };
}

/** Sätter en ruta till vägg eller fri. Start och mål kan inte bli väggar. */
export function withWall(maze: Maze, node: NodeId, wall: boolean): Maze {
  if (node === maze.start || node === maze.goal || maze.walls[node] === wall) return maze;
  const walls = [...maze.walls];
  walls[node] = wall;
  return { ...maze, walls };
}

/** Flyttar start eller mål. En vägg på den nya platsen tas bort. */
export function withEndpoint(maze: Maze, which: "start" | "goal", node: NodeId): Maze {
  const other = which === "start" ? maze.goal : maze.start;
  if (node === other) return maze;
  const walls = [...maze.walls];
  walls[node] = false;
  return { ...maze, walls, [which]: node };
}
