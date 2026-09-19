import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { toFechaInputValue } from "@/lib/format";
import { MobilePageHeader } from "@/components/dashboard/mobile-page-header";
import { GastoForm } from "../gasto-form";
import { updateGasto } from "../actions";

export default async function EditarGastoPage({
  params,
}: {
  params: Promise<{ gastoId: string }>;
}) {
  const { gastoId } = await params;
  const [gasto, motos] = await Promise.all([
    prisma.gasto.findUnique({ where: { id: gastoId } }),
    prisma.motocicleta.findMany({
      orderBy: { placa: "asc" },
      select: { id: true, placa: true, marca: true, modelo: true },
    }),
  ]);

  if (!gasto) {
    notFound();
  }

  const actionConId = updateGasto.bind(null, gasto.id);

  return (
    <div className="flex flex-col gap-4">
      <MobilePageHeader title="Editar gasto" backHref="/gastos" />

      <nav className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>
        <ChevronRight className="size-3" />
        <Link href="/gastos" className="hover:text-foreground">
          Gastos
        </Link>
        <ChevronRight className="size-3" />
        <span className="font-medium text-foreground">Editar</span>
      </nav>

      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Editar gasto</h1>
      <div className="max-w-xl">
        <GastoForm
          action={actionConId}
          motos={motos}
          valoresIniciales={{
            motocicletaId: gasto.motocicletaId,
            fecha: toFechaInputValue(gasto.fecha),
            categoria: gasto.categoria,
            descripcion: gasto.descripcion,
            monto: gasto.monto.toString(),
          }}
        />
      </div>
    </div>
  );
}
