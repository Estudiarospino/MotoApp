import Link from "next/link";
import { Plus, Receipt, Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCOP, sumarPesos } from "@/lib/money";
import { formatFecha } from "@/lib/format";
import { buttonVariants, Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteGasto } from "./actions";

const CATEGORIA_LABEL = {
  MANTENIMIENTO: "Mantenimiento",
  REPARACION: "Reparación",
  SEGURO: "Seguro",
  IMPUESTOS: "Impuestos",
  OTRO: "Otro",
} as const;

export default async function GastosPage() {
  const gastos = await prisma.gasto.findMany({
    orderBy: { fecha: "desc" },
    include: { motocicleta: { select: { placa: true, marca: true, modelo: true } } },
  });

  const totalGastos = sumarPesos(...gastos.map((g) => g.monto));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Gastos</h1>
          <p className="text-sm text-muted-foreground">Mantenimiento, reparaciones y otros costos de la flota.</p>
        </div>
        <Link href="/gastos/nuevo" className={buttonVariants()}>
          <Plus data-icon="inline-start" className="size-4" />
          Nuevo gasto
        </Link>
      </div>

      {gastos.length > 0 && (
        <Card>
          <CardContent className="grid grid-cols-2 gap-6">
            <StatCard label="Registros" value={gastos.length.toString()} />
            <StatCard label="Total gastado" value={formatCOP(totalGastos)} />
          </CardContent>
        </Card>
      )}

      {gastos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Receipt className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Todavía no hay gastos registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead className="hidden sm:table-cell">Motocicleta</TableHead>
                <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gastos.map((gasto) => {
                const deleteConId = deleteGasto.bind(null, gasto.id);
                return (
                  <TableRow key={gasto.id}>
                    <TableCell>{formatFecha(gasto.fecha)}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {gasto.motocicleta.placa} — {gasto.motocicleta.marca} {gasto.motocicleta.modelo}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{CATEGORIA_LABEL[gasto.categoria]}</TableCell>
                    <TableCell>{gasto.descripcion}</TableCell>
                    <TableCell className="tabular-nums">{formatCOP(gasto.monto)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/gastos/${gasto.id}`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          Editar
                        </Link>
                        <form action={deleteConId}>
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Eliminar gasto"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
