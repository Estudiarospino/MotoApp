import Link from "next/link";
import { AlertTriangle, ArrowRightLeft, CalendarClock, Coins, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import { formatCOP } from "@/lib/money";
import { formatFecha } from "@/lib/format";
import { IconStatCard } from "@/components/icon-stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type TransferenciaCapitalItem = {
  id: string;
  monto: number;
  fecha: Date;
  notas: string | null;
  prestamoId: string;
};

export function TabResumenFinanciero({
  totalRecaudado,
  totalAbonadoCapital,
  periodosCerrados,
  saldoCapitalPendiente,
  moraAcumulada,
  transferenciasCapital,
}: {
  totalRecaudado: number;
  totalAbonadoCapital: number;
  periodosCerrados: number;
  saldoCapitalPendiente: number;
  moraAcumulada: number;
  transferenciasCapital: TransferenciaCapitalItem[];
}) {
  const promedioPorPeriodo = periodosCerrados > 0 ? Math.round(totalRecaudado / periodosCerrados) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <IconStatCard icon={Wallet} label="Total recaudado" value={formatCOP(totalRecaudado)} hint="histórico del contrato" />
        <IconStatCard
          icon={PiggyBank}
          label="Abonado a capital"
          value={formatCOP(totalAbonadoCapital)}
          tono="success"
          hint="histórico del contrato"
        />
        <IconStatCard
          icon={AlertTriangle}
          label="Mora acumulada actual"
          value={formatCOP(moraAcumulada)}
          tono={moraAcumulada > 0 ? "warning" : "success"}
          hint={moraAcumulada > 0 ? "pendiente de pago" : "al día"}
        />
        <IconStatCard icon={CalendarClock} label="Periodos cerrados" value={periodosCerrados.toString()} hint="desde el inicio" />
        <IconStatCard
          icon={TrendingUp}
          label="Promedio por periodo"
          value={periodosCerrados > 0 ? formatCOP(promedioPorPeriodo) : "—"}
          hint="cobrado en promedio"
        />
        <IconStatCard icon={Coins} label="Saldo de capital pendiente" value={formatCOP(saldoCapitalPendiente)} hint="por pagar" />
      </div>

      {transferenciasCapital.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="size-4 text-muted-foreground" />
              Capital agregado por préstamos transferidos
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Estos montos aumentaron el valor y el saldo pendiente del contrato; no son pagos del cliente.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Nota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transferenciasCapital.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{formatFecha(t.fecha)}</TableCell>
                      <TableCell>
                        <Link href={`/prestamos/${t.prestamoId}`} className="font-medium text-primary hover:underline">
                          Préstamo
                        </Link>
                      </TableCell>
                      <TableCell className="tabular-nums">{formatCOP(t.monto)}</TableCell>
                      <TableCell className="text-muted-foreground">{t.notas ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
