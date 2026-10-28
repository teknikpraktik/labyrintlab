import type { Maze, MazeId } from "./search/types";

/**
 * De två fasta banorna i LabyrintLab.
 *
 * Banorna ritas som text:  "#" = vägg, "." = fri ruta, "S" = start, "M" = mål.
 * Kolumner betecknas A, B, C … och rader 1, 2, 3 … i gränssnittet.
 *
 * Att det bara finns två banor är ett medvetet pedagogiskt val: fokus ska
 * ligga på att jämföra algoritmerna på *samma* problem, inte på många banor.
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

export const MAZES: Record<MazeId, Maze> = {
  grund: parseMaze(GRUNDBANAN),
  fallgrop: parseMaze(FALLGROPEN),
};

export const MAZE_IDS: MazeId[] = ["grund", "fallgrop"];
