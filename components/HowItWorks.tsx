"use client";

import { useRef } from "react";

const STEPS = [
  { title: "Välj bana", text: "Grundbanan för en första genomgång, Fallgropen för att utmana algoritmerna." },
  { title: "Gissa algoritm", text: "Vilken algoritm tror du fungerar bäst på banan? BFS, DFS, Greedy eller A*?" },
  { title: "Kör stegvis", text: "Klicka på Steg och följ hur algoritmen tar ut noder och fyller på sin kö, stack eller prioritetskö." },
  { title: "Jämför", text: "Kör samma bana med en annan algoritm. Resultaten hamnar i en jämförelsetabell." },
  { title: "Diskutera", text: "Använd reflektionsfrågorna: vad är ”bäst”, och varför blev resultaten olika?" },
];

export function HowItWorks({ className = "link-button" }: { className?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" className={className} onClick={() => dialogRef.current?.showModal()}>
        Så fungerar det
      </button>
      <dialog
        ref={dialogRef}
        className="modal"
        aria-labelledby="how-title"
        onClick={(e) => {
          // Stäng när man klickar utanför innehållet.
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className="modal-body">
          <h2 id="how-title">Så fungerar LabyrintLab</h2>
          <ol className="how-list">
            {STEPS.map((step) => (
              <li key={step.title}>
                <strong>{step.title}</strong>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
          <p className="hint">
            Tips: tangenten → kör ett steg. Fokusläget förstorar labyrinten och datastrukturen för projektor.
          </p>
          <form method="dialog">
            <button type="submit" className="btn btn-primary" autoFocus>
              Stäng
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
