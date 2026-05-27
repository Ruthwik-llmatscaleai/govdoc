import { BigQuery } from "@google-cloud/bigquery";

export interface RecentActivityItem {
  status: "PASS" | "FAIL" | "REVIEW";
  documentName: string;
  timestamp: Date;
}

export async function getRecentActivity(userId: string): Promise<RecentActivityItem[]> {
  const projectId = process.env.BIGQUERY_PROJECT || process.env.GCP_PROJECT_ID || "genai-poc-424806";
  const bq = new BigQuery({ projectId });
  const datasetId = process.env.BIGQUERY_DATASET || "Govdoc";
  const tableId = process.env.BIGQUERY_TABLE_CONVERSATIONS || "chat_conversations";

  const query = `
    SELECT
      'REVIEW' as status,
      COALESCE(c.title, 'Untitled') as documentName,
      c.created_at as timestamp
    FROM \`${projectId}.${datasetId}.${tableId}\` c
    WHERE c.user_id = @userId
      AND c.created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
    ORDER BY c.created_at DESC
    LIMIT 10
  `;

  try {
    const [rows] = await bq.query({ query, params: { userId } });
    return rows.map((row: Record<string, unknown>) => ({
      status: (row.status as string) as "PASS" | "FAIL" | "REVIEW",
      documentName: row.documentName as string,
      timestamp: new Date((row.timestamp as { value: string }).value),
    }));
  } catch (error) {
    console.error("Failed to fetch recent activity:", error);
    return [];
  }
}
