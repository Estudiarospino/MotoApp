import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { MotoForm } from "../moto-form";
import { updateMotocicleta } from "../actions";

export default async function EditarMotoPage({
  params,
}: {
  params: Promise<{ motoId: string }>;
}) {
  const { motoId } = await params;
  const moto = await prisma.motocicleta.findUnique({ where: { id: motoId } });

  if (!moto) {
    notFound();
  }

  const actionConId = updateMotocicleta.bind(null, moto.id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Editar moto</h1>
      <MotoForm
        action={actionConId}
        valoresIniciales={{
          marca: moto.marca,
          modelo: moto.modelo,
          placa: moto.placa,
          color: moto.color ?? undefined,
          anioModelo: moto.anioModelo?.toString(),
          precioInicial: moto.precioInicial.toString(),
          notas: moto.notas ?? undefined,
        }}
      />
    </div>
  );
}
