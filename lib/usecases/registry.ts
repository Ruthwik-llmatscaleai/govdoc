import type { UseCase } from "./types";

export const USE_CASES = {} as const;

export function getUseCase(id: string): UseCase | undefined {
  // USE_CASES is intentionally empty ({}); cast needed because Object.values({} as const) is never[]
  return (Object.values(USE_CASES) as UseCase[]).find((u) => u.id === id);
}

export const USE_CASES_BY_TILE: Record<"review" | "search" | "draft" | "inbox", UseCase[]> = {
  review: [],
  search: [],
  draft: [],
  inbox: [],
};
