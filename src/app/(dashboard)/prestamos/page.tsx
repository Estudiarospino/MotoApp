import Link from "next/link";
import { HandCoins, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCOP, sumarPesos } from "@/lib/money";
import { formatFecha } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default async function PrestamosPage() {
  const prestamos = await prisma.prestamo.findMany({
    orderBy: { fecha: "desc" },
    include: { cliente: { select: { nombreCompleto: true } } },
  });

  const activos = prestamos.filter((p) => p.estado === "ACTIVO");
  const saldoTotal = sumarPesos(...activos.map((p) => p.saldoPendiente));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Préstamos</h1>
          <p className="text-sm text-muted-foreground">Ledger de préstamos a clientes, independiente del arriendo.</p>
        </div>
        <Link href="/prestamos/nuevo" className={buttonVariants()}>
          <Plus data-icon="inline-start" className="size-4" />
          Nuevo préstamo
        </Link>
      </div>

      {prestamos.length > 0 && (
        <Card>
          <CardContent className="grid grid-cols-2 gap-6">
            <StatCard label="Préstamos activos" value={activos.length.toString()} />
            <StatCard label="Saldo pendiente total" value={formatCOP(saldoTotal)} />
          </CardContent>
        </Card>
      )}

      {prestamos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <HandCoins className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Todavía no hay préstamos registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden sm:table-cell">Monto original</TableHead>
                <TableHead>Saldo pendiente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prestamos.map((prestamo) => (
                <TableRow key={prestamo.id}>
                  <TableCell>{formatFecha(prestamo.fecha)}</TableCell>
                  <TableCell>{prestamo.cliente.nombreCompleto}</TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">
                    {formatCOP(prestamo.montoOriginal)}
                  </TableCell>
                  <TableCell className="tabular-nums">{formatCOP(prestamo.saldoPendiente)}</TableCell>
                  <TableCell>
                    <Badge variant={prestamo.estado === "ACTIVO" ? "default" : "secondary"}>
                      {prestamo.estado === "ACTIVO" ? "Activo" : "Pagado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/prestamos/${prestamo.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Ver
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
