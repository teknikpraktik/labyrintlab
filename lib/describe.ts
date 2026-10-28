import { nodeLabel, pathLength } from "./search/common";
import { ALGORITHMS } from "./search";
import type { AlgorithmId, Maze, NodeId, SearchStep } from "./search/types";

/**
 * Översätter ett SearchStep till en kort svensk förklaring av vad som hände.
 * Ligger utanför algoritmerna så att de bara behöver leverera data.
 */

function list(maze: Maze, nodes: NodeId[]): string {
  return nodes.map((n) => nodeLabel(maze, n)).join(", ");
}

function where(algorithm: AlgorithmId): { from: string; into: string } {
  switch (algorithm) {
    case "bfs":
      return { from: "från början av kön", into: "sist i kön" };
    case "dfs":
      return { from: "från toppen av stacken", into: "överst på stacken" };
    default:
      return { from: "ur prioritetskön", into: "i prioritetskön" };
  }
}

function priorityText(algorithm: AlgorithmId, step: SearchStep, node: NodeId): string {
  if (algorithm === "greedy") return ` – den har lägst h (h = ${step.hScore?.[node]})`;
  if (algorithm === "astar") {
    const g = step.gScore?.[node];
    const h = step.hScore?.[node];
    return ` – den har lägst f (f = g + h = ${g} + ${h} = ${step.fScore?.[node]})`;
  }
  return "";
}

export function describeStep(maze: Maze, algorithm: AlgorithmId, step: SearchStep): string[] {
  const info = ALGORITHMS[algorithm];
  const { from, into } = where(algorithm);
  const lines: string[] = [];

  if (step.stepNumber === 0) {
    lines.push(`Startrutan ${nodeLabel(maze, maze.start)} läggs ${into}.`);
    lines.push(`Klicka på Steg för att ta ut första noden ur ${info.structureDefinite}.`);
    return lines;
  }

  if (step.currentNode === null) {
    lines.push(`${info.structureDefinite[0].toUpperCase()}${info.structureDefinite.slice(1)} är tom – det finns ingen väg till målet.`);
    return lines;
  }

  const current = step.currentNode;
  lines.push(`Tar ut ${nodeLabel(maze, current)} ${from}${priorityText(algorithm, step, current)}.`);

  if (step.found) {
    const length = pathLength(step.path);
    lines.push(`${nodeLabel(maze, current)} är målet! Vägen följs bakåt via föräldrarna: ${length} steg.`);
    return lines;
  }

  if (step.addedNodes.length > 0) {
    lines.push(`Lägger ${list(maze, step.addedNodes)} ${into}.`);
  }
  if (step.updatedNodes.length > 0) {
    lines.push(
      algorithm === "dfs"
        ? `${list(maze, step.updatedNodes)} låg redan i stacken och flyttas upp överst.`
        : `Hittade en kortare väg till ${list(maze, step.updatedNodes)} – g och f uppdateras.`,
    );
  }
  if (step.addedNodes.length === 0 && step.updatedNodes.length === 0) {
    lines.push("Inga nya grannar att lägga till – alla är väggar eller redan upptäckta.");
  }
  return lines;
}
