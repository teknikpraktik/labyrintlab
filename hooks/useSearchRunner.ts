"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ALGORITHMS } from "@/lib/search";
import type { AlgorithmId, Maze, SearchGenerator, SearchStep } from "@/lib/search/types";

export type RunStatus = "idle" | "paused" | "running" | "finished";

export type Speed = "slow" | "normal" | "fast";

export const SPEEDS: Record<Speed, { label: string; ms: number }> = {
  slow: { label: "Långsam", ms: 1000 },
  normal: { label: "Normal", ms: 500 },
  fast: { label: "Snabb", ms: 180 },
};

/**
 * Styr en sökning steg för steg.
 *
 * Algoritmen är en generator: varje anrop till next() kör exakt en iteration
 * (ta ut en nod, undersök grannarna, uppdatera frontier). Inget räknas ut i
 * förväg – Steg, Auto och Snabbkör driver alla samma generator.
 */
export function useSearchRunner(
  maze: Maze,
  algorithm: AlgorithmId,
  onFinished: (step: SearchStep) => void,
) {
  const generatorRef = useRef<SearchGenerator | null>(null);
  const onFinishedRef = useRef(onFinished);
  const [step, setStep] = useState<SearchStep | null>(null);
  const [status, setStatus] = useState<RunStatus>("idle");
  const [speed, setSpeed] = useState<Speed>("normal");

  useEffect(() => {
    onFinishedRef.current = onFinished;
  });

  const finish = useCallback((last: SearchStep) => {
    generatorRef.current = null;
    setStep(last);
    setStatus("finished");
    onFinishedRef.current(last);
  }, []);

  /** Skapar en ny generator och visar startläget (steg 0). */
  const start = useCallback(() => {
    const generator = ALGORITHMS[algorithm].run(maze);
    generatorRef.current = generator;
    const first = generator.next();
    if (!first.done) setStep(first.value);
    setStatus("paused");
  }, [algorithm, maze]);

  /** Kör exakt ett algoritmiskt steg. */
  const advance = useCallback(() => {
    const generator = generatorRef.current;
    if (!generator) return;
    const result = generator.next();
    if (result.done) {
      generatorRef.current = null;
      setStatus("finished");
      return;
    }
    if (result.value.finished) finish(result.value);
    else setStep(result.value);
  }, [finish]);

  const stepOnce = useCallback(() => {
    if (status === "finished") return;
    if (!generatorRef.current) {
      start();
      return;
    }
    setStatus("paused");
    advance();
  }, [advance, start, status]);

  const play = useCallback(() => {
    if (status === "finished") return;
    if (!generatorRef.current) start();
    setStatus("running");
  }, [start, status]);

  const pause = useCallback(() => {
    if (status === "running") setStatus("paused");
  }, [status]);

  /** Snabbkör: kör resten av sökningen direkt och visar slutresultatet. */
  const runToEnd = useCallback(() => {
    if (status === "finished") return;
    const generator = generatorRef.current ?? ALGORITHMS[algorithm].run(maze);
    let last: SearchStep | null = null;
    for (const s of generator) last = s;
    if (last) finish(last);
  }, [algorithm, finish, maze, status]);

  const reset = useCallback(() => {
    generatorRef.current = null;
    setStep(null);
    setStatus("idle");
  }, []);

  // Auto: ett steg per tick tills sökningen är klar eller pausas.
  useEffect(() => {
    if (status !== "running") return;
    const id = window.setInterval(advance, SPEEDS[speed].ms);
    return () => window.clearInterval(id);
  }, [advance, speed, status]);

  return { step, status, speed, setSpeed, start, stepOnce, play, pause, runToEnd, reset };
}
