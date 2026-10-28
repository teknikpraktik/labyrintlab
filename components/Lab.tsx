"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { DataStructureView } from "@/components/DataStructureView";
import { HowItWorks } from "@/components/HowItWorks";
import { MazeGrid } from "@/components/MazeGrid";
import {
  AlgorithmInfoPanel,
  Comparison,
  Legend,
  Metrics,
  PhaseStepper,
  Prediction,
  Reflection,
} from "@/components/Panels";
import { SPEEDS, useSearchRunner, type Speed } from "@/hooks/useSearchRunner";
import { describeStep } from "@/lib/describe";
import { MAZE_IDS, MAZES } from "@/lib/mazes";
import { ALGORITHMS, ALGORITHM_IDS, shortestPathLength, toRunResult, type RunResult } from "@/lib/search";
import type { AlgorithmId, MazeId, SearchStep } from "@/lib/search/types";

type ResultsByMaze = Record<MazeId, Partial<Record<AlgorithmId, RunResult>>>;

/** Optimal väglängd per bana, beräknad en gång med BFS. */
const OPTIMAL: Record<MazeId, number | null> = {
  grund: shortestPathLength(MAZES.grund),
  fallgrop: shortestPathLength(MAZES.fallgrop),
};

export function Lab() {
  const [mazeId, setMazeId] = useState<MazeId>("grund");
  const [algorithm, setAlgorithm] = useState<AlgorithmId>("bfs");
  const [predictions, setPredictions] = useState<Partial<Record<MazeId, AlgorithmId>>>({});
  // Resultaten finns bara i minnet under sessionen – inget sparas mellan besök.
  const [results, setResults] = useState<ResultsByMaze>({ grund: {}, fallgrop: {} });
  const [focusMode, setFocusMode] = useState(false);
  const [showValues, setShowValues] = useState(true);
  const algorithmGroupRef = useRef<HTMLDivElement>(null);

  const maze = MAZES[mazeId];
  const optimal = OPTIMAL[mazeId];
  const prediction = predictions[mazeId] ?? null;
  const mazeResults = results[mazeId];
  const resultCount = Object.keys(mazeResults).length;

  const handleFinished = useCallback(
    (step: SearchStep) => {
      setResults((prev) => ({
        ...prev,
        [mazeId]: { ...prev[mazeId], [algorithm]: toRunResult(algorithm, step, optimal) },
      }));
    },
    [algorithm, mazeId, optimal],
  );

  const runner = useSearchRunner(maze, algorithm, handleFinished);
  const { step, status } = runner;

  const selectMaze = (id: MazeId) => {
    runner.reset();
    setMazeId(id);
  };

  const selectAlgorithm = (id: AlgorithmId) => {
    runner.reset();
    setAlgorithm(id);
  };

  const runAnother = () => {
    runner.reset();
    const next = ALGORITHM_IDS.find((id) => id !== algorithm && !mazeResults[id]);
    if (next) setAlgorithm(next);
    requestAnimationFrame(() => {
      algorithmGroupRef.current?.querySelector<HTMLButtonElement>("[aria-pressed='true']")?.focus();
    });
  };

  // Tangentbord: → kör ett steg, Esc lämnar fokusläget.
  const { stepOnce } = runner;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, dialog")) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        stepOnce();
      } else if (e.key === "Escape") {
        setFocusMode(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepOnce]);

  const activePhase =
    status === "paused" || status === "running"
      ? 2
      : resultCount >= 2
        ? 4
        : resultCount === 1
          ? 3
          : prediction
            ? 1
            : 0;

  const finishedResult = status === "finished" ? (mazeResults[algorithm] ?? null) : null;
  const info = ALGORITHMS[algorithm];
  const explanation = step ? describeStep(maze, algorithm, step) : null;

  return (
    <div className={`app${focusMode ? " is-focus" : ""}`}>
      <header className="topbar">
        <div className="brand-wrap">
          <Link href="/" className="brand">
            LabyrintLab
          </Link>
          <span className="brand-sub focus-hide">Testa, jämför och förstå sökalgoritmer</span>
        </div>
        <div className="topbar-actions">
          <span className="focus-hide">
            <HowItWorks />
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            aria-pressed={focusMode}
            onClick={() => setFocusMode((f) => !f)}
          >
            {focusMode ? "Lämna fokusläge" : "Fokusläge"}
          </button>
        </div>
      </header>

      <div className="focus-hide">
        <PhaseStepper active={activePhase} />
      </div>

      <main className="lab">
        <div className="lab-main">
          <section className="panel maze-panel" aria-labelledby="maze-title">
            <div className="panel-head">
              <h2 id="maze-title">{maze.name}</h2>
              <span className="run-label">
                {info.name}
                {step ? ` · steg ${step.stepNumber}` : ""}
                {status === "running" ? " · kör…" : ""}
              </span>
            </div>
            <p className="hint focus-hide">{maze.description}</p>
            <MazeGrid maze={maze} step={step} algorithm={algorithm} showValues={showValues} />
            <Legend />
          </section>
        </div>

        <aside className="lab-side">
          <section className="panel focus-hide" aria-labelledby="maze-select-title">
            <h2 id="maze-select-title">Välj bana</h2>
            <div className="choice-row" role="group" aria-labelledby="maze-select-title">
              {MAZE_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="choice"
                  aria-pressed={mazeId === id}
                  onClick={() => selectMaze(id)}
                >
                  {MAZES[id].name}
                </button>
              ))}
            </div>
          </section>

          <div className="focus-hide">
            <Prediction
              prediction={prediction}
              onPredict={(id) =>
                setPredictions((prev) => ({ ...prev, [mazeId]: id ?? undefined }))
              }
            />
          </div>

          <section className="panel controls" aria-labelledby="algo-title">
            <h2 id="algo-title">
              <span className="focus-hide">2. Testa: välj algoritm</span>
              <span className="focus-only">Välj algoritm</span>
            </h2>
            <div className="choice-row" role="group" aria-labelledby="algo-title" ref={algorithmGroupRef}>
              {ALGORITHM_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="choice"
                  aria-pressed={algorithm === id}
                  onClick={() => selectAlgorithm(id)}
                >
                  {ALGORITHMS[id].name}
                  {mazeResults[id] && <span className="choice-check" aria-label=" (körd)">✓</span>}
                </button>
              ))}
            </div>
            <div className="focus-hide">
              <AlgorithmInfoPanel algorithm={algorithm} />
            </div>

            <div className="button-row">
              <button type="button" className="btn btn-primary" onClick={runner.start} disabled={status !== "idle"}>
                Starta
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={stepOnce}
                disabled={status === "finished"}
                aria-keyshortcuts="ArrowRight"
              >
                Steg
              </button>
              <button
                type="button"
                className="btn"
                onClick={runner.play}
                disabled={status === "finished" || status === "running"}
              >
                Auto
              </button>
              <button type="button" className="btn" onClick={runner.pause} disabled={status !== "running"}>
                Pausa
              </button>
              <button type="button" className="btn" onClick={runner.runToEnd} disabled={status === "finished"}>
                Snabbkör
              </button>
            </div>
            <div className="button-row">
              <button type="button" className="btn btn-ghost" onClick={runner.reset} disabled={status === "idle"}>
                Återställ
              </button>
              <button
                type="button"
                className={`btn ${status === "finished" ? "btn-accent" : "btn-ghost"}`}
                onClick={runAnother}
                disabled={status === "idle" && resultCount === 0}
              >
                Kör annan algoritm
              </button>
            </div>

            <div className="option-row">
              <div className="speed" role="group" aria-label="Hastighet för Auto">
                <span className="option-label" aria-hidden>
                  Hastighet:
                </span>
                {(Object.keys(SPEEDS) as Speed[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="choice choice-small"
                    aria-pressed={runner.speed === s}
                    onClick={() => runner.setSpeed(s)}
                  >
                    {SPEEDS[s].label}
                  </button>
                ))}
              </div>
              {info.priority && (
                <label className="toggle">
                  <input type="checkbox" checked={showValues} onChange={(e) => setShowValues(e.target.checked)} />
                  Visa {info.priority} i rutnätet
                </label>
              )}
            </div>
          </section>

          <section className="panel now" aria-labelledby="now-title" aria-live="polite">
            <h2 id="now-title">
              <span className="focus-hide">3. Observera: vad händer nu?</span>
              <span className="focus-only">Vad händer nu?</span>
            </h2>
            {explanation ? (
              <ul className="now-list">
                {explanation.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="empty">Tryck på Starta eller Steg för att börja.</p>
            )}
          </section>

          <DataStructureView maze={maze} algorithm={algorithm} step={step} />

          <Metrics
            stepNumber={step?.stepNumber ?? 0}
            visited={step?.visited.length ?? 0}
            frontier={step?.frontier.length ?? 0}
            maxFrontier={step?.maxFrontierSize ?? 0}
            result={finishedResult}
            optimal={optimal}
          />
        </aside>
      </main>

      <div className="lab-bottom focus-hide">
        <Comparison
          results={mazeResults}
          prediction={prediction}
          onClear={() => setResults((prev) => ({ ...prev, [mazeId]: {} }))}
        />
        {resultCount >= 2 && <Reflection mazeId={mazeId} prediction={prediction} />}
      </div>
    </div>
  );
}
