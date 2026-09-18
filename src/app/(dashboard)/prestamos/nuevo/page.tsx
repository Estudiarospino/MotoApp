import { prisma } from "@/lib/db";
import { PrestamoForm } from "../prestamo-form";

export default async function NuevoPrestamoPage() {
  const clientes = await prisma.cliente.findMany({
    where: { activo: true },
    orderBy: { nombreCompleto: "asc" },
    select: { id: true, nombreCompleto: true, numeroIdentificacion: true },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nuevo préstamo</h1>
      <PrestamoForm clientes={clientes} />
    </div>
  );
}
