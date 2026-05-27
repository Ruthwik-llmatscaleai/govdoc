import { BigQuery } from "@google-cloud/bigquery";

export interface RecentActivityItem {
  status: "PASS" | "FAIL" | "REVIEW";
  documentName: string;
  timestamp: Date;
}

export async function getRecentActivity(userId: string): Promise<RecentActivityItem[]> {
  const bq = new BigQuery();
  const datasetId = process.env.BIGQUERY_DATASET || "govdoc";
  const tableId = "chat_sessions";

  const query = `
    SELECT
      COALESCE(JSON_EXTRACT_SCALAR(metadata, '$.status'), 'REVIEW') as status,
      COALESCE(JSON_EXTRACT_SCALAR(metadata, '$.documentName'), 'Untitled') as documentName,
      created_at as timestamp
    FROM \`${bq.projectId}.${datasetId}.${tableId}\`
    WHERE user_id = @userId
      AND created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
    ORDER BY created_at DESC
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
