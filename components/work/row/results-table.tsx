"use client";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";

function scoreClass(score: number): string {
  if (score === -1) return "bg-gray-100 text-gray-700";
  if (score >= 4) return "bg-green-100 text-green-800";
  if (score === 3) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

function scoreLabel(score: number): string {
  if (score === -1) return "N/A";
  if (score === 0) return "Error";
  return String(score);
}

export function ResultsTable({ results }: { results: EvaluationResult[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 bg-background border-b">
          <tr>
            <th className="text-left p-2">Category</th>
            <th className="text-left p-2">Score</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Criteria Met</th>
            <th className="text-left p-2">Evidence</th>
            <th className="text-left p-2">Comments</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.category} className="border-b align-top">
              <td className="p-2 font-medium">{r.category}</td>
              <td className="p-2"><span className={`px-2 py-1 rounded ${scoreClass(r.score)}`}>{scoreLabel(r.score)}</span></td>
              <td className="p-2">{r.status}</td>
              <td className="p-2 max-w-xs">{r.criteria_met}</td>
              <td className="p-2 max-w-xs">{r.evidence}</td>
              <td className="p-2 max-w-xs">{r.comments}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
