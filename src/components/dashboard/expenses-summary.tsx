import Link from "next/link";
import { formatCOP } from "@/lib/money";
import type { GastoPorCategoria } from "@/server/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CATEGORIA_LABEL: Record<string, string> = {
  MANTENIMIENTO: "Mantenimiento",
  REPARACION: "Reparación",
  SEGURO: "Seguro",
  IMPUESTOS: "Impuestos",
  OTRO: "Otro",
};

const CATEGORIA_COLOR: Record<string, string> = {
  MANTENIMIENTO: "bg-primary",
  REPARACION: "bg-violet-500",
  SEGURO: "bg-warning",
  IMPUESTOS: "bg-destructive",
  OTRO: "bg-muted-foreground",
};

export function ExpensesSummary({ items, total }: { items: GastoPorCategoria[]; total: number }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Gastos del mes</CardTitle>
        <Link href="/gastos" className="text-xs font-medium text-primary hover:underline">
          Ver todos
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Sin gastos registrados este mes.</p>
        ) : (
          <>
            {items.map((item) => (
              <div key={item.categoria} className="flex items-center justify-between py-1.5 text-sm">
                <span className="flex items-center gap-2 text-foreground">
                  <span className={`size-2 rounded-full ${CATEGORIA_COLOR[item.categoria] ?? "bg-muted-foreground"}`} />
                  {CATEGORIA_LABEL[item.categoria] ?? item.categoria}
                  <span className="text-xs text-muted-foreground">({item.cantidad})</span>
                </span>
                <span className="font-medium tabular-nums text-foreground">{formatCOP(item.total)}</span>
              </div>
            ))}
            <div className="mt-1 flex items-center justify-between border-t border-border pt-3 text-sm font-medium text-foreground">
              <span>Total</span>
              <span className="tabular-nums">{formatCOP(total)}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
