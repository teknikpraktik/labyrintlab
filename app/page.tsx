import Link from "next/link";
import { HowItWorks } from "@/components/HowItWorks";
import { MazeGrid } from "@/components/MazeGrid";
import { MAZES } from "@/lib/mazes";
import { runToEnd } from "@/lib/search";

// Dekorativ förhandsvisning: A*:s färdiga sökning i Fallgropen.
const preview = runToEnd("astar", MAZES.fallgrop);

export default function Home() {
  return (
    <main className="home">
      <div className="home-hero">
        <p className="home-kicker">Hur hittar AI vägen?</p>
        <h1>LabyrintLab</h1>
        <p className="home-subtitle">Testa, jämför och förstå sökalgoritmer</p>
        <p className="home-text">
          Olika sökalgoritmer kan lösa samma problem på helt olika sätt. Förutsäg vad som händer, kör algoritmen steg
          för steg och jämför resultatet.
        </p>
        <div className="home-actions">
          <Link href="/lab" className="btn btn-primary btn-large">
            Starta LabyrintLab
          </Link>
          <HowItWorks className="btn btn-ghost btn-large" />
        </div>
        <p className="home-algos">BFS · DFS · Greedy Best-First Search · A*</p>
      </div>
      <div className="home-preview">
        <MazeGrid maze={MAZES.fallgrop} step={preview} compact />
      </div>
    </main>
  );
}
