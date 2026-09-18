import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { prisma } from "@/lib/db";
import { diasDesde } from "@/lib/format";
import { UMBRAL_PERIODO_ABIERTO_DIAS } from "@/lib/contrato-estado";
import { motoNecesitaAtencionDocumentos } from "@/lib/moto-documentos";
import { DashboardShell } from "@/components/dashboard/shell";
import { logout } from "./actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getCurrentUser();
  if (!usuario) {
    redirect("/login");
  }

  const [contratosActivos, motosActivas] = await Promise.all([
    prisma.contrato.findMany({
      where: { estado: "ACTIVO" },
      select: { moraAcumulada: true, fechaAperturaPeriodoActual: true },
    }),
    prisma.motocicleta.findMany({
      where: { estado: { in: ["DISPONIBLE", "EN_CONTRATO"] } },
      select: { soatFechaExpedicion: true, tecnomecanicaFechaExpedicion: true },
    }),
  ]);
  const notificacionesContratos = contratosActivos.filter(
    (c) => c.moraAcumulada > 0 || diasDesde(c.fechaAperturaPeriodoActual) > UMBRAL_PERIODO_ABIERTO_DIAS,
  ).length;
  const notificacionesMotos = motosActivas.filter(motoNecesitaAtencionDocumentos).length;
  const notificaciones = notificacionesContratos + notificacionesMotos;

  return (
    <DashboardShell
      usuario={{ nombre: usuario.nombre, email: usuario.email }}
      notificaciones={notificaciones}
      onLogout={logout}
    >
      {children}
    </DashboardShell>
  );
}
