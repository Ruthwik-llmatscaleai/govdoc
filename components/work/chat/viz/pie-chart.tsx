"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatValue, VIZ_COLORS } from "./format";
import type { VizItem } from "./viz-block";

export function VizPieChart({ data, unit }: { data: VizItem[]; unit?: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={1}>
          {data.map((_, i) => (
            <Cell key={i} fill={VIZ_COLORS[i % VIZ_COLORS.length]} stroke="#FCFAF3" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number | string, name) => [formatValue(Number(v), unit), name as string]}
          contentStyle={{ border: "1px solid #d6cfba", borderRadius: 8, fontSize: 12, background: "#FCFAF3" }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "#556157" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
