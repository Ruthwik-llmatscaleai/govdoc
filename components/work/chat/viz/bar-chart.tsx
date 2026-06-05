"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompact, formatValue, VIZ_COLORS } from "./format";
import type { VizItem } from "./viz-block";

export function VizBarChart({ data, unit }: { data: VizItem[]; unit?: string }) {
  const seriesKeys = Array.from(new Set(data.map((d) => d.series).filter((s): s is string => Boolean(s))));

  // --- Grouped comparison (data points carry a `series`, e.g. city name) ---
  if (seriesKeys.length > 0) {
    const labels = Array.from(new Set(data.map((d) => d.label)));
    const rows = labels.map((label) => {
      const row: Record<string, string | number> = { label };
      for (const s of seriesKeys) {
        row[s] = data.find((d) => d.label === label && d.series === s)?.value ?? 0;
      }
      return row;
    });
    const height = Math.max(220, rows.length * (seriesKeys.length * 22 + 16) + 56);
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid horizontal={false} stroke="#e2dcc9" />
          <XAxis type="number" tickFormatter={(v) => formatCompact(Number(v), unit)} tick={{ fontSize: 11, fill: "#6E706A" }} stroke="#d6cfba" />
          <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11, fill: "#556157" }} stroke="#d6cfba" />
          <Tooltip
            cursor={{ fill: "rgba(61,87,64,0.06)" }}
            formatter={(v: number | string, name) => [formatValue(Number(v), unit), name as string]}
            contentStyle={{ border: "1px solid #d6cfba", borderRadius: 8, fontSize: 12, background: "#FCFAF3" }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "#556157" }} />
          {seriesKeys.map((s, i) => (
            <Bar key={s} dataKey={s} fill={VIZ_COLORS[i % VIZ_COLORS.length]} radius={[0, 3, 3, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // --- Single series ---
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 38 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid horizontal={false} stroke="#e2dcc9" />
        <XAxis type="number" tickFormatter={(v) => formatCompact(Number(v), unit)} tick={{ fontSize: 11, fill: "#6E706A" }} stroke="#d6cfba" />
        <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11, fill: "#556157" }} stroke="#d6cfba" />
        <Tooltip
          cursor={{ fill: "rgba(61,87,64,0.06)" }}
          formatter={(v: number | string) => [formatValue(Number(v), unit), ""]}
          contentStyle={{ border: "1px solid #d6cfba", borderRadius: 8, fontSize: 12, background: "#FCFAF3" }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={VIZ_COLORS[i % VIZ_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
