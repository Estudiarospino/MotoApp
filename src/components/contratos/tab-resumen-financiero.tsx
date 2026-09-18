import { AlertTriangle, CalendarClock, Coins, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import { formatCOP } from "@/lib/money";
import { IconStatCard } from "@/components/icon-stat-card";

export function TabResumenFinanciero({
  totalRecaudado,
  totalAbonadoCapital,
  periodosCerrados,
  saldoCapitalPendiente,
  moraAcumulada,
}: {
  totalRecaudado: number;
  totalAbonadoCapital: number;
  periodosCerrados: number;
  saldoCapitalPendiente: number;
  moraAcumulada: number;
}) {
  const promedioPorPeriodo = periodosCerrados > 0 ? Math.round(totalRecaudado / periodosCerrados) : 0;

  return (
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
  );
}
