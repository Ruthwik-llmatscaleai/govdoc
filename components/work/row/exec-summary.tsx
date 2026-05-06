"use client";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";

type Status = "Pass" | "Warning" | "Fail" | "N/A";

const STATUS_CLASS: Record<Status, string> = {
  Pass: "bg-green-100 text-green-800",
  Warning: "bg-yellow-100 text-yellow-800",
  Fail: "bg-red-100 text-red-800",
  "N/A": "bg-gray-100 text-gray-700",
};

function statusOf(score: number): Status {
  if (score === -1) return "N/A";
  if (score >= 4) return "Pass";
  if (score === 3) return "Warning";
  return "Fail";
}

export function ExecSummary({ results }: { results: EvaluationResult[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 bg-background border-b">
          <tr>
            <th className="text-left p-2">Category</th>
            <th className="text-left p-2">Score</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Comments</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const status = statusOf(r.score);
            return (
              <tr key={r.category} className="border-b align-top">
                <td className="p-2 font-medium">{r.category}</td>
                <td className="p-2">{r.score === -1 ? "N/A" : r.score}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_CLASS[status]}`}>
                    {status}
                  </span>
                </td>
                <td className="p-2 max-w-md">{r.comments}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
