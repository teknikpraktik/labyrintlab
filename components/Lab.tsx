"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DataStructureView } from "@/components/DataStructureView";
import { HowItWorks } from "@/components/HowItWorks";
import { MazeGrid, type MazeEditorHandlers } from "@/components/MazeGrid";
import {
  AlgorithmInfoPanel,
  Comparison,
  Legend,
  Metrics,
  PHASES,
  PhaseStepper,
  Reflection,
  type Phase,
} from "@/components/Panels";
import { SPEEDS, useSearchRunner, type Speed } from "@/hooks/useSearchRunner";
import { describeStep } from "@/lib/describe";
import { CUSTOM_MAZE_NAME, FIXED_MAZE_IDS, MAZE_IDS, MAZES, createCustomMaze, withEndpoint, withWall } from "@/lib/mazes";
import { ALGORITHMS, ALGORITHM_IDS, shortestPathLength, toRunResult, type RunResult } from "@/lib/search";
import type { AlgorithmId, FixedMazeId, Maze, MazeId, NodeId, SearchStep } from "@/lib/search/types";

type ResultsByMaze = Record<MazeId, Partial<Record<AlgorithmId, RunResult>>>;

/** Optimal väglängd per fast bana, beräknad en gång med BFS. */
const OPTIMAL = Object.fromEntries(
  FIXED_MAZE_IDS.map((id) => [id, shortestPathLength(MAZES[id])]),
) as Record<FixedMazeId, number | null>;

/** Ritverktyg för Bana 4. */
type Tool = "wall" | "start" | "goal";

/** Vad en pågående dragning gör med rutorna den passerar. */
type PaintMode = "wall" | "erase" | "start" | "goal";

const TOOLS: { id: Tool; label: string }[] = [
  { id: "wall", label: "Väggar" },
  { id: "start", label: "Start" },
  { id: "goal", label: "Mål" },
];

function shortName(id: MazeId): string {
  return (id === "egen" ? CUSTOM_MAZE_NAME : MAZES[id].name).replace(/^Bana \d: /, "");
}

export function Lab() {
  const [phase, setPhase] = useState<Phase>(0);
  const [mazeId, setMazeId] = useState<MazeId>("grund");
  const [algorithm, setAlgorithm] = useState<AlgorithmId>("random");
  const [predictions, setPredictions] = useState<Partial<Record<MazeId, AlgorithmId>>>({});
  // Resultaten finns bara i minnet under sessionen – inget sparas mellan besök.
  const [results, setResults] = useState<ResultsByMaze>({ grund: {}, fallgrop: {}, atervand: {}, egen: {} });
  const [customMaze, setCustomMaze] = useState<Maze>(() => createCustomMaze());
  const [tool, setTool] = useState<Tool>("wall");
  const paintModeRef = useRef<PaintMode>("wall");
  const [focusMode, setFocusMode] = useState(false);
  const [showValues, setShowValues] = useState(true);

  const isCustom = mazeId === "egen";
  const maze = isCustom ? customMaze : MAZES[mazeId];
  const customOptimal = useMemo(() => shortestPathLength(customMaze), [customMaze]);
  const optimal = isCustom ? customOptimal : OPTIMAL[mazeId];
  const editing = isCustom && phase === 0;
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
  const { step, status, stepOnce } = runner;

  const selectMaze = (id: MazeId) => {
    runner.reset();
    setMazeId(id);
  };

  const selectAlgorithm = (id: AlgorithmId) => {
    runner.reset();
    setAlgorithm(id);
  };

  // Bana 4: varje ändring gör tidigare körningar på banan ogiltiga.
  const beginEdit = () => {
    runner.reset();
    setResults((prev) => (Object.keys(prev.egen).length ? { ...prev, egen: {} } : prev));
  };

  const applyPaint = (mode: PaintMode, node: NodeId) => {
    setCustomMaze((m) => {
      if (mode === "start" || mode === "goal") return withEndpoint(m, mode, node);
      return withWall(m, node, mode === "wall");
    });
  };

  const editor: MazeEditorHandlers = {
    onPaintStart: (node) => {
      beginEdit();
      // Dra i S eller flaggan för att flytta dem, oavsett valt verktyg.
      const mode: PaintMode =
        node === customMaze.start
          ? "start"
          : node === customMaze.goal
            ? "goal"
            : tool !== "wall"
              ? tool
              : customMaze.walls[node]
                ? "erase"
                : "wall";
      paintModeRef.current = mode;
      applyPaint(mode, node);
    },
    onPaint: (node) => applyPaint(paintModeRef.current, node),
  };

  const loadTemplate = (template?: Maze) => {
    beginEdit();
    setCustomMaze(createCustomMaze(template));
  };

  const startRun = () => {
    if (status === "idle") runner.start();
    setPhase(2);
  };

  const runAnother = () => {
    runner.reset();
    const next = ALGORITHM_IDS.find((id) => id !== algorithm && !mazeResults[id]);
    if (next) setAlgorithm(next);
    setPhase(1);
  };

  // Tangentbord: → kör ett steg i Observera, Esc lämnar fokusläget.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, dialog")) return;
      if (e.key === "ArrowRight" && phase === 2) {
        e.preventDefault();
        stepOnce();
      } else if (e.key === "Escape") {
        setFocusMode(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, stepOnce]);

  const done = [prediction !== null, resultCount >= 1, resultCount >= 1, resultCount >= 2, false];
  const finishedResult = status === "finished" ? (mazeResults[algorithm] ?? null) : null;
  const info = ALGORITHMS[algorithm];
  const explanation = step ? describeStep(maze, algorithm, step) : null;

  const nav = (back: Phase | null, next: Phase | null, nextLabel?: string) => (
    <div className="phase-nav">
      {back !== null ? (
        <button type="button" className="btn btn-ghost" onClick={() => setPhase(back)}>
          ← {PHASES[back].title}
        </button>
      ) : (
        <span />
      )}
      {next !== null && (
        <button type="button" className="btn btn-primary" onClick={() => setPhase(next)}>
          {nextLabel ?? PHASES[next].title} →
        </button>
      )}
    </div>
  );

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
            className="btn btn-ghost btn-small"
            aria-pressed={focusMode}
            onClick={() => setFocusMode((f) => !f)}
          >
            {focusMode ? "Lämna fokusläge" : "Fokusläge"}
          </button>
        </div>
      </header>

      <div className="focus-hide">
        <PhaseStepper active={phase} done={done} onSelect={setPhase} />
      </div>

      <main className="lab">
        <section className="panel maze-panel" aria-labelledby="maze-title">
          <div className="panel-head">
            <h2 id="maze-title">{maze.name}</h2>
            <span className="run-label">
              {info.name}
              {editing ? " · ritläge" : step ? ` · steg ${step.stepNumber}` : ""}
              {status === "running" ? " · kör…" : ""}
            </span>
          </div>
          <div className="maze-area">
            <MazeGrid
              maze={maze}
              step={editing ? null : step}
              algorithm={algorithm}
              showValues={showValues}
              editor={editing ? editor : undefined}
            />
          </div>
          <Legend />
        </section>

        <section className="panel phase-panel" aria-labelledby="phase-title">
          <h2 id="phase-title" className="phase-title">
            <span className="phase-num" aria-hidden>
              {phase + 1}
            </span>
            {PHASES[phase].title}
          </h2>

          {phase === 0 && (
            <div className="phase-body">
              <div className="block">
                <h3 id="maze-select-title">Välj bana</h3>
                <div className="choice-grid" role="group" aria-labelledby="maze-select-title">
                  {MAZE_IDS.map((id, i) => (
                    <button
                      key={id}
                      type="button"
                      className="choice"
                      aria-pressed={mazeId === id}
                      onClick={() => selectMaze(id)}
                    >
                      <span className="choice-num">{i + 1}</span> {shortName(id)}
                    </button>
                  ))}
                </div>
                {!isCustom && <p className="hint">{maze.description}</p>}
              </div>
              {isCustom && (
                <div className="block editor">
                  <h3 id="editor-title">Rita din bana</h3>
                  <div className="editor-row">
                    <div className="choice-row" role="group" aria-labelledby="editor-title">
                      {TOOLS.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className="choice choice-small"
                          aria-pressed={tool === t.id}
                          onClick={() => setTool(t.id)}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <label className="template-select">
                      <span className="option-label">Börja från</span>
                      <select
                        value=""
                        onChange={(e) => {
                          const id = e.target.value;
                          if (id) loadTemplate(id === "tom" ? undefined : MAZES[id as FixedMazeId]);
                        }}
                      >
                        <option value="">Välj…</option>
                        <option value="tom">Tom bana</option>
                        {FIXED_MAZE_IDS.map((id) => (
                          <option key={id} value={id}>
                            {shortName(id)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="hint">
                    {tool === "wall"
                      ? "Klicka eller dra för att rita/sudda väggar. Dra S eller flaggan för att flytta dem."
                      : `Klicka på en ruta för att placera ${tool === "start" ? "start" : "målet"}.`}
                  </p>
                  <p className={`editor-status${customOptimal === null ? " is-warning" : ""}`} role="status">
                    {customOptimal === null
                      ? "⚠ Ingen väg från start till mål. Algoritmerna söker igenom allt de når och ger sedan upp."
                      : `✓ Det finns en väg. Kortaste vägen är ${customOptimal} steg.`}
                  </p>
                </div>
              )}
              <div className="block">
                <h3 id="predict-title">Vilken algoritm tror du fungerar bäst på denna bana?</h3>
                <ul className={`predict-list${isCustom ? " is-compact" : ""}`} aria-labelledby="predict-title">
                  {ALGORITHM_IDS.map((id) => (
                    <li key={id}>
                      <button
                        type="button"
                        className="choice predict-choice"
                        aria-pressed={prediction === id}
                        onClick={() =>
                          setPredictions((prev) => ({ ...prev, [mazeId]: prediction === id ? undefined : id }))
                        }
                      >
                        <strong>{ALGORITHMS[id].name}</strong>
                        {!isCustom && <span>{ALGORITHMS[id].tagline}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              {nav(null, 1, prediction ? "Testa" : "Hoppa över – Testa")}
            </div>
          )}

          {phase === 1 && (
            <div className="phase-body">
              <div className="block">
                <h3 id="algo-title">Välj algoritm</h3>
                <div className="choice-row" role="group" aria-labelledby="algo-title">
                  {ALGORITHM_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      className="choice"
                      aria-pressed={algorithm === id}
                      onClick={() => selectAlgorithm(id)}
                    >
                      {ALGORITHMS[id].name}
                      {mazeResults[id] && (
                        <span className="choice-check" aria-label=" (körd)">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <AlgorithmInfoPanel algorithm={algorithm} />
              <div className="phase-nav">
                <button type="button" className="btn btn-ghost" onClick={() => setPhase(0)}>
                  ← {PHASES[0].title}
                </button>
                <button type="button" className="btn btn-primary" onClick={startRun}>
                  {status === "idle" ? `Starta ${info.name}` : "Fortsätt sökningen"} →
                </button>
              </div>
            </div>
          )}

          {phase === 2 && (
            <div className="phase-body phase-observe">
              <div className="controls">
                {status === "idle" ? (
                  <button type="button" className="btn btn-primary" onClick={runner.start}>
                    Starta
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={stepOnce}
                    disabled={status === "finished"}
                    aria-keyshortcuts="ArrowRight"
                  >
                    Steg
                  </button>
                )}
                {status === "running" ? (
                  <button type="button" className="btn" onClick={runner.pause}>
                    Pausa
                  </button>
                ) : (
                  <button type="button" className="btn" onClick={runner.play} disabled={status === "finished"}>
                    Auto
                  </button>
                )}
                <button type="button" className="btn" onClick={runner.runToEnd} disabled={status === "finished"}>
                  Snabbkör
                </button>
                <button type="button" className="btn btn-ghost" onClick={runner.reset} disabled={status === "idle"}>
                  Återställ
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
                    Visa {info.priority}
                  </label>
                )}
              </div>

              <div className="block now" aria-live="polite">
                <h3>Vad händer nu?</h3>
                {explanation ? (
                  <ul className="now-list">
                    {explanation.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty">Tryck på Starta för att börja. Sedan kör Steg (eller →) ett steg i taget.</p>
                )}
              </div>

              {status === "finished" ? (
                <Metrics
                  stepNumber={step?.stepNumber ?? 0}
                  visited={step?.visited.length ?? 0}
                  frontier={step?.frontier.length ?? 0}
                  maxFrontier={step?.maxFrontierSize ?? 0}
                  result={finishedResult}
                  optimal={optimal}
                />
              ) : (
                <>
                  <DataStructureView maze={maze} algorithm={algorithm} step={step} />
                  <Metrics
                    stepNumber={step?.stepNumber ?? 0}
                    visited={step?.visited.length ?? 0}
                    frontier={step?.frontier.length ?? 0}
                    maxFrontier={step?.maxFrontierSize ?? 0}
                    result={null}
                    optimal={optimal}
                  />
                </>
              )}

              {status === "finished" ? (
                <div className="phase-nav">
                  <button type="button" className="btn" onClick={runAnother}>
                    Kör annan algoritm
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => setPhase(3)}>
                    Jämför →
                  </button>
                </div>
              ) : (
                status === "idle" && nav(1, null)
              )}
            </div>
          )}

          {phase === 3 && (
            <div className="phase-body">
              <p className="hint">{maze.name}</p>
              <Comparison results={mazeResults} prediction={prediction} />
              <div className="phase-nav">
                <button type="button" className="btn" onClick={runAnother}>
                  Kör annan algoritm
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setPhase(4)}>
                  Reflektera →
                </button>
              </div>
            </div>
          )}

          {phase === 4 && (
            <div className="phase-body">
              <Reflection mazeId={mazeId} prediction={prediction} />
              <div className="phase-nav">
                <button type="button" className="btn btn-ghost" onClick={() => setPhase(3)}>
                  ← {PHASES[3].title}
                </button>
                {mazeId !== "egen" && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      selectMaze(MAZE_IDS[MAZE_IDS.indexOf(mazeId) + 1]);
                      setPhase(0);
                    }}
                  >
                    Prova {shortName(MAZE_IDS[MAZE_IDS.indexOf(mazeId) + 1])} →
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
