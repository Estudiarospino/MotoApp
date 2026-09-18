import { AlertTriangle, Bike, ClipboardList, DollarSign } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { prisma } from "@/lib/db";
import { formatCOP, sumarPesos } from "@/lib/money";
import { diasDesde } from "@/lib/format";
import { UMBRAL_PERIODO_ABIERTO_DIAS } from "@/lib/contrato-estado";
import {
  distribucionDesdeMeses,
  getEstadoFlota,
  getGastosDelMes,
  getPrestamosActivos,
  getResumenFinanciero,
  getTendenciaContratosNuevos,
  getTendenciaMoraGenerada,
  getUltimosMovimientos,
} from "@/server/dashboard";
import { IconStatCard } from "@/components/icon-stat-card";
import { HeroBanner } from "@/components/dashboard/hero-banner";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { FinancialChart } from "@/components/dashboard/financial-chart";
import { PaymentsDonut } from "@/components/dashboard/payments-donut";
import { AttentionTable } from "@/components/dashboard/attention-table";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { FleetStatus } from "@/components/dashboard/fleet-status";
import { ExpensesSummary } from "@/components/dashboard/expenses-summary";
import { ActiveLoans } from "@/components/dashboard/active-loans";
import { VehicleDocsAttention } from "@/components/dashboard/vehicle-docs-attention";

export default async function DashboardHomePage() {
  const [
    usuario,
    contratosActivos,
    totalContratos,
    motos,
    motosDocumentos,
    resumenFinanciero,
    tendenciaContratos,
    tendenciaMora,
    estadoFlota,
    gastosDelMes,
    prestamosActivos,
    ultimosMovimientos,
  ] = await Promise.all([
    getCurrentUser(),
    prisma.contrato.findMany({
      where: { estado: "ACTIVO" },
      orderBy: { moraAcumulada: "desc" },
      include: {
        cliente: { select: { nombreCompleto: true } },
        motocicleta: { select: { placa: true } },
      },
    }),
    prisma.contrato.count(),
    prisma.motocicleta.findMany({ select: { estado: true } }),
    prisma.motocicleta.findMany({
      where: { estado: { in: ["DISPONIBLE", "EN_CONTRATO"] } },
      select: { id: true, placa: true, soatFechaExpedicion: true, tecnomecanicaFechaExpedicion: true },
    }),
    getResumenFinanciero(),
    getTendenciaContratosNuevos(),
    getTendenciaMoraGenerada(),
    getEstadoFlota(),
    getGastosDelMes(),
    getPrestamosActivos(),
    getUltimosMovimientos(),
  ]);

  const moraTotal = sumarPesos(...contratosActivos.map((c) => c.moraAcumulada));
  const contratosEnMora = contratosActivos.filter((c) => c.moraAcumulada > 0).length;
  const disponibles = motos.filter((m) => m.estado === "DISPONIBLE").length;

  const necesitanAtencion = contratosActivos
    .filter((c) => c.moraAcumulada > 0 || diasDesde(c.fechaAperturaPeriodoActual) > UMBRAL_PERIODO_ABIERTO_DIAS)
    .sort((a, b) => b.moraAcumulada - a.moraAcumulada);

  const distribucionPagos = distribucionDesdeMeses(resumenFinanciero, 6);

  return (
    <div className="flex flex-col gap-6">
      <HeroBanner nombre={usuario?.nombre ?? ""} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <IconStatCard
          icon={ClipboardList}
          label="Contratos activos"
          value={contratosActivos.length.toString()}
          hint={`de ${totalContratos} contratos totales`}
          progreso={totalContratos === 0 ? 0 : (contratosActivos.length / totalContratos) * 100}
          tendenciaPct={tendenciaContratos.variacionPct}
        />
        <IconStatCard
          icon={DollarSign}
          label="Mora total de cartera"
          value={formatCOP(moraTotal)}
          hint={`en ${contratosEnMora} contrato${contratosEnMora === 1 ? "" : "s"}`}
          tono={moraTotal > 0 ? "warning" : "success"}
          tendenciaPct={tendenciaMora.variacionPct}
        />
        <IconStatCard
          icon={AlertTriangle}
          label="Necesitan atención"
          value={necesitanAtencion.length.toString()}
          hint="contratos en riesgo"
          tono={necesitanAtencion.length > 0 ? "warning" : "success"}
          href="/contratos"
        />
        <IconStatCard
          icon={Bike}
          label="Motos disponibles"
          value={`${disponibles} / ${motos.length}`}
          hint="en tu flota"
          href="/motos"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <FinancialChart meses={resumenFinanciero} />
        </div>
        <div className="lg:col-span-3">
          <PaymentsDonut distribucion={distribucionPagos} />
        </div>
        <div className="lg:col-span-4">
          <QuickActions />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <AttentionTable contratos={necesitanAtencion} />
        </div>
        <div className="lg:col-span-4">
          <RecentActivity movimientos={ultimosMovimientos} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <FleetStatus items={estadoFlota} />
        <ExpensesSummary items={gastosDelMes.items} total={gastosDelMes.total} />
        <ActiveLoans items={prestamosActivos.items} totalPendiente={prestamosActivos.totalPendiente} />
        <VehicleDocsAttention motos={motosDocumentos} />
      </div>
    </div>
  );
}
