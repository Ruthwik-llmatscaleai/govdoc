import { create } from "zustand";
import type { Artifact } from "@/lib/artifacts";

// Holds the artifact side-panel state. Tiles call openArtifact(); the panel + the
// chat layout read `open`. A single message's artifacts are loaded together so the
// panel can tab between them.
interface ArtifactsState {
  open: boolean;
  artifacts: Artifact[];
  index: number;
  openArtifact: (artifacts: Artifact[], index: number) => void;
  setIndex: (index: number) => void;
  close: () => void;
}

export const useArtifacts = create<ArtifactsState>((set) => ({
  open: false,
  artifacts: [],
  index: 0,
  openArtifact: (artifacts, index) => set({ open: true, artifacts, index }),
  setIndex: (index) => set({ index }),
  close: () => set({ open: false }),
}));
