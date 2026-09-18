import { prisma } from "@/lib/db";
import { GastoForm } from "../gasto-form";
import { createGasto } from "../actions";

export default async function NuevoGastoPage({
  searchParams,
}: {
  searchParams: Promise<{ motoId?: string }>;
}) {
  const { motoId } = await searchParams;
  const motos = await prisma.motocicleta.findMany({
    orderBy: { placa: "asc" },
    select: { id: true, placa: true, marca: true, modelo: true },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nuevo gasto</h1>
      <GastoForm action={createGasto} motos={motos} valoresIniciales={{ motocicletaId: motoId }} />
    </div>
  );
}
