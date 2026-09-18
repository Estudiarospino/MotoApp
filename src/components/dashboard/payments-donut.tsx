"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCOP } from "@/lib/money";
import type { DistribucionPagos } from "@/server/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatCompacto(valor: number): string {
  if (valor >= 1_000_000) return `$${(valor / 1_000_000).toFixed(1)}M`;
  if (valor >= 1_000) return `$${Math.round(valor / 1_000)}K`;
  return formatCOP(valor);
}

function TooltipPersonalizado({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ backgroundColor: item.payload.color }} />
        <span className="text-muted-foreground">{item.name}</span>
      </div>
      <p className="mt-0.5 font-medium tabular-nums text-popover-foreground">{formatCOP(item.value)}</p>
    </div>
  );
}

export function PaymentsDonut({ distribucion }: { distribucion: DistribucionPagos }) {
  const datos = [
    { key: "arriendo", label: "Arriendo (operación)", value: distribucion.arriendoOperacion, color: "var(--chart-1)" },
    { key: "abono", label: "Abono a capital", value: distribucion.abonoCapital, color: "var(--chart-2)" },
    { key: "moras", label: "Moras", value: distribucion.moras, color: "var(--chart-5)" },
  ].filter((d) => d.value > 0);

  const sinDatos = distribucion.total === 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Distribución de pagos</CardTitle>
      </CardHeader>
      <CardContent>
        {sinDatos ? (
          <p className="flex h-[170px] items-center justify-center text-center text-sm text-muted-foreground">
            Todavía no hay pagos registrados en el periodo.
          </p>
        ) : (
          <div className="flex flex-row items-center gap-5 sm:flex-col sm:items-stretch">
            <div className="relative h-28 w-28 shrink-0 sm:h-[170px] sm:w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datos}
                    dataKey="value"
                    nameKey="label"
                    innerRadius="68%"
                    outerRadius="100%"
                    strokeWidth={2}
                    stroke="var(--card)"
                    isAnimationActive={false}
                  >
                    {datos.map((d) => (
                      <Cell key={d.key} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipPersonalizado />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">
                <p className="text-xs font-semibold tabular-nums text-foreground sm:hidden">
                  {formatCompacto(distribucion.total)}
                </p>
                <p className="hidden text-lg font-semibold tabular-nums text-foreground sm:block">
                  {formatCOP(distribucion.total)}
                </p>
                <p className="text-[9px] text-muted-foreground sm:text-[11px]">Recaudado</p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:mt-1 sm:flex-none">
              {datos.map((d) => {
                const pct = Math.round((d.value / distribucion.total) * 100);
                return (
                  <div key={d.key} className="flex items-start gap-2 text-sm">
                    <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                    <div className="min-w-0">
                      <p className="truncate text-foreground">
                        {d.label} <span className="text-muted-foreground">({pct}%)</span>
                      </p>
                      <p className="text-xs tabular-nums text-muted-foreground">{formatCOP(d.value)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
