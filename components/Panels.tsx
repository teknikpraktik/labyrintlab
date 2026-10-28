import { ALGORITHMS, ALGORITHM_IDS, type RunResult } from "@/lib/search";
import type { AlgorithmId, MazeId } from "@/lib/search/types";
import { GoalFlag } from "./MazeGrid";

/** Pedagogisk sekvens: förutsäg → testa → observera → jämför → reflektera. */
export const PHASES = [
  { title: "Förutsäg", text: "Vilken algoritm passar bäst?" },
  { title: "Testa", text: "Välj algoritm och kör." },
  { title: "Observera", text: "Följ sökningen steg för steg." },
  { title: "Jämför", text: "Ställ resultaten mot varandra." },
  { title: "Reflektera", text: "Diskutera frågorna." },
] as const;

export type Phase = 0 | 1 | 2 | 3 | 4;

interface PhaseStepperProps {
  active: Phase;
  done: boolean[];
  onSelect: (phase: Phase) => void;
}

/** De fem stegen fungerar som flikar: sidopanelen visar ett steg i taget. */
export function PhaseStepper({ active, done, onSelect }: PhaseStepperProps) {
  return (
    <nav className="stepper" aria-label="Arbetsgång">
      <ol>
        {PHASES.map((phase, i) => (
          <li key={phase.title}>
            <button
              type="button"
              className={`stepper-item${i === active ? " is-active" : ""}${done[i] ? " is-done" : ""}`}
              aria-current={i === active ? "step" : undefined}
              onClick={() => onSelect(i as Phase)}
            >
              <span className="stepper-num" aria-hidden>
                {done[i] && i !== active ? "✓" : i + 1}
              </span>
              <span className="stepper-text">
                <strong>{phase.title}</strong>
                <span>{phase.text}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function AlgorithmInfoPanel({ algorithm }: { algorithm: AlgorithmId }) {
  const info = ALGORITHMS[algorithm];
  return (
    <div className="algo-info">
      <p className="algo-title">
        <strong>{info.fullName}</strong>
        <span className={`tag tag-${info.kind === "Informerad" ? "informed" : "uninformed"}`}>
          {info.kind} sökning
        </span>
      </p>
      <p>{info.description}</p>
      <p className="hint">
        Frontier: <strong>{info.structure.toLowerCase()}</strong> – {info.structureHint}
      </p>
      {info.priority && (
        <details className="manhattan">
          <summary>Manhattanavstånd{info.priority === "f" ? " och f = g + h" : ""}</summary>
          <p className="formula">h = |x₁ − x₂| + |y₁ − y₂|</p>
          <p>
            Manhattanavstånd räknar hur många steg i sidled och höjdled som skiljer två rutor åt om man inte kan gå
            diagonalt.
          </p>
          {info.priority === "f" && (
            <p>
              <strong>g</strong> = antal steg från start hittills, <strong>h</strong> = uppskattat avstånd kvar,{" "}
              <strong>f = g + h</strong>.
            </p>
          )}
        </details>
      )}
      {algorithm === "dfs" && (
        <p className="hint">Grannordning: upp, höger, ned, vänster. DFS undersöker därför alltid uppåt först.</p>
      )}
    </div>
  );
}

interface MetricsProps {
  stepNumber: number;
  visited: number;
  frontier: number;
  maxFrontier: number;
  result: RunResult | null;
  optimal: number | null;
}

/** Kompakt rad med mätvärden. När sökningen är klar visas resultatet. */
export function Metrics({ stepNumber, visited, frontier, maxFrontier, result, optimal }: MetricsProps) {
  return (
    <div className="block metrics">
      <dl className="metric-grid">
        {result ? (
          <>
            <Metric label="Besökta" value={visited} />
            <Metric label="Väglängd" value={result.pathLength ?? "–"} />
            <Metric label="Max frontier" value={maxFrontier} />
            <Metric label="Kortaste väg" value={result.pathLength === null ? "–" : result.isShortest ? "Ja" : "Nej"} />
          </>
        ) : (
          <>
            <Metric label="Steg" value={stepNumber} />
            <Metric label="Besökta" value={visited} />
            <Metric label="Frontier nu" value={frontier} />
            <Metric label="Max frontier" value={maxFrontier} />
          </>
        )}
      </dl>
      {result && optimal === null && <p className="hint">Det finns ingen väg mellan start och mål i banan.</p>}
      {result && optimal !== null && (
        <p className="hint">
          Kortaste väg {result.isShortest ? "Ja" : "Nej"}: vägen {result.isShortest ? "har" : "har inte"} samma längd
          som den kortaste möjliga i banan ({optimal} steg).
        </p>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="metric">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

interface ComparisonProps {
  results: Partial<Record<AlgorithmId, RunResult>>;
  prediction: AlgorithmId | null;
}

export function Comparison({ results, prediction }: ComparisonProps) {
  const rows = ALGORITHM_IDS.flatMap((id) => (results[id] ? [results[id]] : []));
  if (rows.length === 0) {
    return <p className="empty">Kör en algoritm till slut så sparas resultatet här.</p>;
  }
  return (
    <>
      <div className="table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col">Algoritm</th>
              <th scope="col" className="num">Besökta noder</th>
              <th scope="col" className="num">Väglängd</th>
              <th scope="col" className="num">Max frontier</th>
              <th scope="col">Kortaste väg</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.algorithm}>
                <th scope="row">
                  {ALGORITHMS[r.algorithm].name}
                  {prediction === r.algorithm && (
                    <span className="badge badge-guess" title="Din gissning">
                      gissning
                    </span>
                  )}
                </th>
                <td className="num">{r.visitedCount}</td>
                <td className="num">{r.pathLength ?? "–"}</td>
                <td className="num">{r.maxFrontierSize}</td>
                <td>{r.pathLength === null ? "–" : r.isShortest ? "Ja" : "Nej"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint">
        {rows.length < 2
          ? "Kör minst en algoritm till på samma bana för att kunna jämföra."
          : "Vilken algoritm som är ”bäst” beror på vad man värderar. Resonera utifrån måtten!"}
      </p>
    </>
  );
}

const GENERAL_QUESTIONS = [
  "Vilken algoritm undersökte minst antal noder?",
  "Vilken hittade kortast väg?",
  "Vilken använde störst frontier?",
  "Varför fick algoritmerna olika resultat?",
  "Finns det en algoritm som alltid är bäst?",
];

/** Extra frågor för varje bana. */
const MAZE_QUESTIONS: Record<MazeId, { title: string; questions: string[] }> = {
  grund: { title: "", questions: [] },
  fallgrop: {
    title: "Särskilt för Fallgropen",
    questions: [
      "Varför blev Greedy lurad?",
      "Varför lyckades A* bättre?",
      "Vad gjorde DFS ineffektivt i denna bana?",
    ],
  },
  atervand: {
    title: "Särskilt för Återvändsgränden",
    questions: [
      "Vilka algoritmer gick in i återvändsgränden? Varför?",
      "Varför gick även A* in i korridoren, trots att den hittade kortaste vägen?",
      "Vad kan Manhattanavståndet inte ”se” i en labyrint?",
      "Hur märks det i datastrukturen när en algoritm måste backa?",
    ],
  },
  egen: {
    title: "Särskilt för din egen bana",
    questions: [
      "Vad i din bana gjorde att algoritmerna fick olika resultat?",
      "Kan du rita en bana där Greedy hittar kortaste vägen men DFS inte gör det?",
      "Kan du rita en bana där BFS och A* besöker nästan lika många noder? Varför blir det så?",
      "Vad händer med algoritmerna om det inte finns någon väg till målet?",
    ],
  },
};

export function Reflection({ mazeId, prediction }: { mazeId: MazeId; prediction: AlgorithmId | null }) {
  return (
    <>
      <p className="hint">Diskutera i par eller i helklass. Svaren sparas inte.</p>
      <ol className="questions">
        {prediction && (
          <li>Du gissade på {ALGORITHMS[prediction].name}. Stämde din förutsägelse? Varför, eller varför inte?</li>
        )}
        {GENERAL_QUESTIONS.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ol>
      {MAZE_QUESTIONS[mazeId].questions.length > 0 && (
        <>
          <h3>{MAZE_QUESTIONS[mazeId].title}</h3>
          <ol className="questions">
            {MAZE_QUESTIONS[mazeId].questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
        </>
      )}
    </>
  );
}

export function Legend() {
  const items = [
    { cls: "cell-wall", label: "Vägg" },
    { cls: "cell-visited", label: "Besökt", dot: true },
    { cls: "cell-frontier", label: "Frontier" },
    { cls: "cell-current", label: "Aktuell" },
    { cls: "cell-path", label: "Väg" },
  ];
  return (
    <ul className="legend" aria-label="Teckenförklaring">
      <li>
        <span className="legend-swatch cell cell-free">
          <span className="cell-symbol">S</span>
        </span>
        Start
      </li>
      <li>
        <span className="legend-swatch cell cell-free">
          <GoalFlag />
        </span>
        Mål
      </li>
      {items.map((item) => (
        <li key={item.label}>
          <span className={`legend-swatch cell ${item.cls}`}>{item.dot && <span className="cell-dot" />}</span>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
