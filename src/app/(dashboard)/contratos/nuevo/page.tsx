import Link from "next/link";
import { prisma } from "@/lib/db";
import { sumarPesos } from "@/lib/money";
import { buttonVariants } from "@/components/ui/button";
import { ContratoForm } from "../contrato-form";
import { createContrato, crearContratoRenegociado } from "../actions";

export default async function NuevoContratoPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string; renegociarDe?: string }>;
}) {
  const { clienteId, renegociarDe } = await searchParams;
  const [clientes, motos] = await Promise.all([
    prisma.cliente.findMany({
      where: { activo: true },
      orderBy: { nombreCompleto: "asc" },
      select: { id: true, nombreCompleto: true, numeroIdentificacion: true },
    }),
    prisma.motocicleta.findMany({
      where: { estado: "DISPONIBLE" },
      orderBy: { placa: "asc" },
      select: { id: true, marca: true, modelo: true, placa: true, precioInicial: true },
    }),
  ]);

  let renegociacion:
    | {
        contratoAnteriorId: string;
        contratoAnteriorFolio: number;
        clienteId: string;
        clienteNombre: string;
        deudaPendiente: number;
      }
    | undefined;

  if (renegociarDe) {
    const contratoAnterior = await prisma.contrato.findUnique({
      where: { id: renegociarDe },
      select: {
        id: true,
        folio: true,
        estado: true,
        clienteId: true,
        saldoCapitalPendiente: true,
        moraAcumulada: true,
        cliente: { select: { nombreCompleto: true } },
        renegociacionComoAnterior: { select: { id: true } },
      },
    });

    if (!contratoAnterior) {
      return (
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold text-foreground">Nuevo contrato</h1>
          <p className="text-sm text-destructive">El contrato que intentas renegociar no existe.</p>
        </div>
      );
    }
    if (contratoAnterior.estado !== "INCUMPLIDO_RECUPERADA") {
      return (
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold text-foreground">Nuevo contrato</h1>
          <p className="text-sm text-destructive">Ese contrato no está incumplido; no hay nada que renegociar.</p>
        </div>
      );
    }
    if (contratoAnterior.renegociacionComoAnterior) {
      return (
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold text-foreground">Nuevo contrato</h1>
          <p className="text-sm text-destructive">Ese contrato ya fue renegociado antes en otro contrato.</p>
        </div>
      );
    }

    renegociacion = {
      contratoAnteriorId: contratoAnterior.id,
      contratoAnteriorFolio: contratoAnterior.folio,
      clienteId: contratoAnterior.clienteId,
      clienteNombre: contratoAnterior.cliente.nombreCompleto,
      deudaPendiente: sumarPesos(contratoAnterior.saldoCapitalPendiente, contratoAnterior.moraAcumulada),
    };
  }

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
      <h1 className="text-2xl font-semibold text-foreground">
        {renegociacion ? "Renegociar contrato" : "Nuevo contrato"}
      </h1>
      <div className="max-w-xl">
        <ContratoForm
          modo="crear"
          action={renegociacion ? crearContratoRenegociado : createContrato}
          clientes={clientes}
          motos={motos}
          clienteIdInicial={clienteId}
          renegociacion={renegociacion}
        />
      </div>
    </div>
  );
}
