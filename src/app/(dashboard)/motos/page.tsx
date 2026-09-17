import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCOP } from "@/lib/money";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteMotoButton } from "./delete-moto-button";

const ESTADO_BADGE = {
  DISPONIBLE: "default",
  EN_CONTRATO: "secondary",
  VENDIDA: "outline",
} as const;

const ESTADO_LABEL = {
  DISPONIBLE: "Disponible",
  EN_CONTRATO: "En contrato",
  VENDIDA: "Vendida",
} as const;

export default async function MotosPage() {
  const motos = await prisma.motocicleta.findMany({
    orderBy: { placa: "asc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Motocicletas</h1>
        <Link href="/motos/nueva" className={buttonVariants()}>
          Nueva moto
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placa</TableHead>
              <TableHead>Marca / Modelo</TableHead>
              <TableHead>Precio inicial</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {motos.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-zinc-500">
                  Todavía no hay motos registradas.
                </TableCell>
              </TableRow>
            )}

            {motos.map((moto) => (
              <TableRow key={moto.id}>
                <TableCell className="font-medium">{moto.placa}</TableCell>
                <TableCell>
                  {moto.marca} {moto.modelo}
                  {moto.anioModelo ? ` (${moto.anioModelo})` : ""}
                </TableCell>
                <TableCell>{formatCOP(moto.precioInicial)}</TableCell>
                <TableCell>
                  <Badge variant={ESTADO_BADGE[moto.estado]}>{ESTADO_LABEL[moto.estado]}</Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-2 text-right">
                  <Link
                    href={`/motos/${moto.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Editar
                  </Link>
                  {moto.estado === "DISPONIBLE" && <DeleteMotoButton motoId={moto.id} />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
