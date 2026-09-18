import Link from "next/link";
import { prisma } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { ContratoForm } from "../contrato-form";
import { createContrato } from "../actions";

export default async function NuevoContratoPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string }>;
}) {
  const { clienteId } = await searchParams;
  const [clientes, motos] = await Promise.all([
    prisma.cliente.findMany({
      where: { activo: true },
      orderBy: { nombreCompleto: "asc" },
      select: { id: true, nombreCompleto: true, numeroIdentificacion: true },
    }),
    prisma.motocicleta.findMany({
      where: { estado: "DISPONIBLE" },
      orderBy: { placa: "asc" },
      select: { id: true, marca: true, modelo: true, placa: true },
    }),
  ]);

  if (clientes.length === 0 || motos.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Nuevo contrato</h1>
        <p className="text-sm text-muted-foreground">
          {clientes.length === 0 && "No hay clientes activos registrados. "}
          {motos.length === 0 && "No hay motos disponibles para asignar. "}
          Registra los datos necesarios antes de crear un contrato.
        </p>
        <div className="flex gap-2">
          <Link href="/clientes/nuevo" className={buttonVariants({ variant: "outline" })}>
            Nuevo cliente
          </Link>
          <Link href="/motos/nueva" className={buttonVariants({ variant: "outline" })}>
            Nueva moto
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-foreground">Nuevo contrato</h1>
      <div className="max-w-xl">
        <ContratoForm
          modo="crear"
          action={createContrato}
          clientes={clientes}
          motos={motos}
          clienteIdInicial={clienteId}
        />
      </div>
    </div>
  );
}
