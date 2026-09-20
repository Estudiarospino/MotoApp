import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { prisma } from "@/lib/db";
import { contratoEnAtrasoCritico } from "@/lib/contrato-estado";
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
      select: {
        moraAcumulada: true,
        fechaInicio: true,
        frecuenciaPago: true,
        pagos: { orderBy: { fecha: "desc" }, take: 1, select: { fecha: true } },
      },
    }),
    prisma.motocicleta.findMany({
      where: { estado: { in: ["DISPONIBLE", "EN_CONTRATO"] } },
      select: { soatFechaExpedicion: true, tecnomecanicaFechaExpedicion: true },
    }),
  ]);
  const notificacionesContratos = contratosActivos.filter(
    (c) =>
      c.moraAcumulada > 0 ||
      contratoEnAtrasoCritico({
        frecuenciaPago: c.frecuenciaPago,
        fechaInicio: c.fechaInicio,
        ultimoPagoFecha: c.pagos[0]?.fecha ?? null,
      }),
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
