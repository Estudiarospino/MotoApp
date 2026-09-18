"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCOP } from "@/lib/money";
import type { MesFinanciero } from "@/server/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RANGOS = [
  { label: "Últimos 3 meses", meses: 3 },
  { label: "Últimos 6 meses", meses: 6 },
  { label: "Últimos 12 meses", meses: 12 },
] as const;

const SERIES = [
  { key: "ingresosTotales", label: "Ingresos totales", color: "var(--chart-1)" },
  { key: "arriendoOperacion", label: "Arriendo (operación)", color: "var(--chart-2)" },
  { key: "abonoCapital", label: "Abono a capital", color: "var(--chart-3)" },
] as const;

function formatCompacto(valor: number): string {
  if (valor >= 1_000_000) return `$${(valor / 1_000_000).toFixed(1)}M`;
  if (valor >= 1_000) return `$${Math.round(valor / 1_000)}K`;
  return `$${valor}`;
}

function TooltipPersonalizado({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-xs shadow-lg">
      <p className="mb-1.5 font-medium text-popover-foreground">{label}</p>
      <div className="flex flex-col gap-1">
        {payload.map((entry) => {
          const serie = SERIES.find((s) => s.key === entry.dataKey);
          return (
            <div key={entry.dataKey} className="flex items-center gap-2">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{serie?.label}</span>
              <span className="ml-auto font-medium tabular-nums text-popover-foreground">
                {formatCOP(entry.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FinancialChart({ meses }: { meses: MesFinanciero[] }) {
  const [rango, setRango] = useState<3 | 6 | 12>(6);
  const datos = meses.slice(-rango);

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Resumen financiero</CardTitle>
        <select
          value={rango}
          onChange={(e) => setRango(Number(e.target.value) as 3 | 6 | 12)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {RANGOS.map((r) => (
            <option key={r.meses} value={r.meses}>
              {r.label}
            </option>
          ))}
        </select>
      </CardHeader>
      <CardContent className="h-[280px] pr-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} barGap={3} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="mes"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={formatCompacto}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <Tooltip content={<TooltipPersonalizado />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
            {SERIES.map((serie) => (
              <Bar
                key={serie.key}
                dataKey={serie.key}
                name={serie.label}
                fill={serie.color}
                radius={[3, 3, 0, 0]}
                maxBarSize={22}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
