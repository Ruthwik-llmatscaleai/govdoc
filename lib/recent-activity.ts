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
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { result: true, createdAt: true, useCaseId: true },
    });

    return runs.map((run) => {
      const meta = run.result as Record<string, unknown> | null;
      const status = (meta?.status as string)?.toUpperCase() ?? "REVIEW";
      const documentName = (meta?.documentName as string) ?? run.useCaseId ?? "Untitled";
      return {
        status: (["PASS", "FAIL", "REVIEW"].includes(status) ? status : "REVIEW") as RecentActivityItem["status"],
        documentName,
        timestamp: run.createdAt,
      };
    });
  } catch {
    return [];
  }
}
