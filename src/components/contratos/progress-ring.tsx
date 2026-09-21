"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export function ProgressRing({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const datos = [
    { key: "completado", value: pct, color: "var(--primary)" },
    { key: "restante", value: 100 - pct, color: "var(--muted)" },
  ];

  return (
    <div className="relative size-24 shrink-0 sm:size-28">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={datos}
            dataKey="value"
            innerRadius="72%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            strokeWidth={0}
            isAnimationActive={false}
          >
            {datos.map((d) => (
              <Cell key={d.key} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">
        <p className="text-xl font-bold tabular-nums text-foreground">{pct}%</p>
        {label && <p className="text-[10px] text-muted-foreground">{label}</p>}
      </div>
    </div>
  );
}
