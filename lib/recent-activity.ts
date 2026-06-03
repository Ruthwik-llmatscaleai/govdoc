import { prisma } from "@/lib/db";

export interface RecentActivityItem {
  status: "PASS" | "FAIL" | "REVIEW";
  documentName: string;
  timestamp: Date;
}

export async function getRecentActivity(userId: string): Promise<RecentActivityItem[]> {
  try {
    const runs = await prisma.evaluationRun.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 10,
      select: { result: true, startedAt: true, useCaseId: true, primaryDocumentName: true },
    });

    return runs.map((run) => {
      const meta = run.result as Record<string, unknown> | null;
      const status = (meta?.status as string)?.toUpperCase() ?? "REVIEW";
      const documentName = run.primaryDocumentName ?? (meta?.documentName as string) ?? run.useCaseId ?? "Untitled";
      return {
        status: (["PASS", "FAIL", "REVIEW"].includes(status) ? status : "REVIEW") as RecentActivityItem["status"],
        documentName,
        timestamp: run.startedAt,
      };
    });
  } catch {
    return [];
  }
}
