import Link from "next/link";
import { Receipt } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCOP } from "@/lib/money";
import { formatFecha, formatFolioContrato } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const METODO_LABEL: Record<string, string> = {
  TRANSFERENCIA: "Transferencia",
  EFECTIVO: "Efectivo",
  OTRO: "Otro",
};

export default async function PagosPage() {
  const [pagos, contratosActivos] = await Promise.all([
    prisma.pago.findMany({
      orderBy: { fecha: "desc" },
      take: 50,
      include: {
        contrato: {
          select: { folio: true, cliente: { select: { nombreCompleto: true } } },
        },
      },
    }),
    prisma.contrato.findMany({
      where: { estado: "ACTIVO" },
      orderBy: { folio: "desc" },
      select: { id: true, folio: true, cliente: { select: { nombreCompleto: true } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Pagos y recibos</h1>
        <p className="text-sm text-muted-foreground">
          Historial de pagos registrados. Cada pago se aplica desde el contrato correspondiente.
        </p>
      </div>

      <Card>
        <CardContent>
          <p className="mb-3 text-sm font-medium text-foreground">Registrar un pago</p>
          {contratosActivos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay contratos activos para registrar pagos.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {contratosActivos.map((c) => (
                <Link
                  key={c.id}
                  href={`/contratos/${c.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  {formatFolioContrato(c.folio)} — {c.cliente.nombreCompleto}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {pagos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Receipt className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Todavía no hay pagos registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                <TableHead className="hidden sm:table-cell">Método</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagos.map((pago) => (
                <TableRow key={pago.id}>
                  <TableCell>{formatFecha(pago.fecha)}</TableCell>
                  <TableCell>
                    <Link href={`/contratos/${pago.contratoId}`} className="font-medium hover:underline">
                      {formatFolioContrato(pago.contrato.folio)}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{pago.contrato.cliente.nombreCompleto}</TableCell>
                  <TableCell className="hidden sm:table-cell">{METODO_LABEL[pago.metodo] ?? pago.metodo}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatCOP(pago.monto)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
