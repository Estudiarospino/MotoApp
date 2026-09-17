import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ClienteForm } from "../cliente-form";
import { updateCliente } from "../actions";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const { clienteId } = await params;
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });

  if (!cliente) {
    notFound();
  }

  const actionConId = updateCliente.bind(null, cliente.id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Editar cliente
      </h1>
      <ClienteForm
        action={actionConId}
        valoresIniciales={{
          nombreCompleto: cliente.nombreCompleto,
          tipoIdentificacion: cliente.tipoIdentificacion,
          numeroIdentificacion: cliente.numeroIdentificacion,
          telefono: cliente.telefono ?? undefined,
          email: cliente.email ?? undefined,
          direccion: cliente.direccion ?? undefined,
          notas: cliente.notas ?? undefined,
        }}
      />
    </div>
  );
}
