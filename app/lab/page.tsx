import type { Metadata } from "next";
import { Lab } from "@/components/Lab";

export const metadata: Metadata = {
  title: "Labbet – LabyrintLab",
};

export default function LabPage() {
  return <Lab />;
}
