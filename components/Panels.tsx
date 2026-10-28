import { ALGORITHMS, ALGORITHM_IDS, type RunResult } from "@/lib/search";
import type { AlgorithmId, MazeId } from "@/lib/search/types";
import { GoalFlag } from "./MazeGrid";

/** Pedagogisk sekvens: förutsäg → testa → observera → jämför → reflektera. */
export const PHASES = [
  { title: "Förutsäg", text: "Vilken algoritm tror du passar bäst?" },
  { title: "Testa", text: "Välj algoritm och kör." },
  { title: "Observera", text: "Följ rutnätet och datastrukturen." },
  { title: "Jämför", text: "Kör en annan algoritm." },
  { title: "Reflektera", text: "Titta på resultaten och diskutera frågorna." },
] as const;

export function PhaseStepper({ active }: { active: number }) {
  return (
    <nav className="stepper" aria-label="Arbetsgång">
      <ol>
        {PHASES.map((phase, i) => (
          <li
            key={phase.title}
            className={i === active ? "is-active" : i < active ? "is-done" : undefined}
            aria-current={i === active ? "step" : undefined}
          >
            <span className="stepper-num" aria-hidden>
              {i + 1}
            </span>
            <span className="stepper-text">
              <strong>{phase.title}</strong>
              <span>{phase.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface PredictionProps {
  prediction: AlgorithmId | null;
  onPredict: (algorithm: AlgorithmId | null) => void;
}

export function Prediction({ prediction, onPredict }: PredictionProps) {
  return (
    <section className="panel predict" aria-labelledby="predict-title">
      <h2 id="predict-title">1. Förutsäg</h2>
      <p>Vilken algoritm tror du fungerar bäst på denna bana?</p>
      <div className="choice-row" role="group" aria-labelledby="predict-title">
        {ALGORITHM_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className="choice"
            aria-pressed={prediction === id}
            onClick={() => onPredict(prediction === id ? null : id)}
          >
            {ALGORITHMS[id].name}
          </button>
        ))}
      </div>
      {prediction && (
        <p className="hint">
          Din gissning: <strong>{ALGORITHMS[prediction].name}</strong>. Testa nu – och jämför sedan med de andra.
        </p>
      )}
    </section>
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
        <p className="hint">
          Grannordning: upp, höger, ned, vänster. DFS undersöker därför alltid uppåt först om det går.
        </p>
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

export function Metrics({ stepNumber, visited, frontier, maxFrontier, result, optimal }: MetricsProps) {
  return (
    <section className="panel metrics" aria-labelledby="metrics-title">
      <h2 id="metrics-title">{result ? `Resultat: ${ALGORITHMS[result.algorithm].name}` : "Mätvärden"}</h2>
      <dl className="metric-grid">
        {!result && (
          <>
            <Metric label="Steg" value={stepNumber} />
            <Metric label="Frontier nu" value={frontier} />
          </>
        )}
        <Metric label="Besökta noder" value={visited} />
        <Metric label="Max frontier" value={maxFrontier} />
        {result && (
          <>
            <Metric label="Väglängd" value={result.pathLength ?? "–"} />
            <Metric label="Kortaste väg" value={result.isShortest ? "Ja" : "Nej"} />
          </>
        )}
      </dl>
      {result && (
        <p className="hint">
          ”Kortaste väg: {result.isShortest ? "Ja" : "Nej"}” betyder att vägen algoritmen hittade{" "}
          {result.isShortest ? "har" : "inte har"} samma längd som den kortaste möjliga vägen i denna bana ({optimal}{" "}
          steg).
        </p>
      )}
      {!result && <p className="hint">Max frontier är ett förenklat mått på hur mycket minne sökningen behöver.</p>}
    </section>
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
  onClear: () => void;
}

export function Comparison({ results, prediction, onClear }: ComparisonProps) {
  const rows = ALGORITHM_IDS.flatMap((id) => (results[id] ? [results[id]] : []));
  return (
    <section className="panel compare" aria-labelledby="compare-title">
      <div className="panel-head">
        <h2 id="compare-title">4. Jämför</h2>
        {rows.length > 0 && (
          <button type="button" className="btn btn-ghost btn-small" onClick={onClear}>
            Rensa jämförelsen
          </button>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="empty">Kör en algoritm till slut så sparas resultatet här.</p>
      ) : (
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
                      {prediction === r.algorithm && <span className="badge badge-guess">din gissning</span>}
                    </th>
                    <td className="num">{r.visitedCount}</td>
                    <td className="num">{r.pathLength ?? "–"}</td>
                    <td className="num">{r.maxFrontierSize}</td>
                    <td>{r.isShortest ? "Ja" : "Nej"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length < 2 && <p className="hint">Kör minst en algoritm till på samma bana för att kunna jämföra.</p>}
          {rows.length >= 2 && (
            <p className="hint">Vilken algoritm som är ”bäst” beror på vad man värderar. Resonera utifrån måtten!</p>
          )}
        </>
      )}
    </section>
  );
}

const GENERAL_QUESTIONS = [
  "Vilken algoritm undersökte minst antal noder?",
  "Vilken hittade kortast väg?",
  "Vilken använde störst frontier?",
  "Varför fick algoritmerna olika resultat?",
  "Finns det en algoritm som alltid är bäst?",
];

const FALLGROP_QUESTIONS = [
  "Varför blev Greedy lurad?",
  "Varför lyckades A* bättre?",
  "Vad gjorde DFS ineffektivt i denna bana?",
];

export function Reflection({ mazeId, prediction }: { mazeId: MazeId; prediction: AlgorithmId | null }) {
  return (
    <section className="panel reflect" aria-labelledby="reflect-title">
      <h2 id="reflect-title">5. Reflektera</h2>
      <p className="hint">Diskutera i par eller i helklass. Svaren sparas inte.</p>
      <ol className="questions">
        {prediction && <li>Du gissade på {ALGORITHMS[prediction].name}. Stämde din förutsägelse? Varför, eller varför inte?</li>}
        {GENERAL_QUESTIONS.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ol>
      {mazeId === "fallgrop" && (
        <>
          <h3>Särskilt för Fallgropen</h3>
          <ol className="questions">
            {FALLGROP_QUESTIONS.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

export function Legend() {
  const items = [
    { cls: "cell-free", label: "Fri ruta" },
    { cls: "cell-wall", label: "Vägg" },
    { cls: "cell-visited", label: "Besökt", dot: true },
    { cls: "cell-frontier", label: "Frontier" },
    { cls: "cell-current", label: "Aktuell nod" },
    { cls: "cell-path", label: "Slutlig väg" },
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
