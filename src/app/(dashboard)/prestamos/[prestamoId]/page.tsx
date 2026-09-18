import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightLeft, HandCoins } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCOP } from "@/lib/money";
import { formatFecha, formatFolioContrato } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AbonoForm } from "../abono-form";
import { TransferenciaCapitalForm } from "../transferencia-capital-form";

export default async function PrestamoDetallePage({
  params,
}: {
  params: Promise<{ prestamoId: string }>;
}) {
  const { prestamoId } = await params;
  const prestamo = await prisma.prestamo.findUnique({
    where: { id: prestamoId },
    include: {
      cliente: { select: { nombreCompleto: true, numeroIdentificacion: true } },
      contrato: { select: { folio: true } },
      abonos: { orderBy: { fecha: "desc" } },
      transferenciasCapital: {
        orderBy: { fecha: "desc" },
        include: { contrato: { select: { id: true, folio: true } } },
      },
    },
  });

  if (!prestamo) {
    notFound();
  }

  const activo = prestamo.estado === "ACTIVO";

  const contratosCliente = activo
    ? await prisma.contrato.findMany({
        where: { clienteId: prestamo.clienteId, estado: "ACTIVO" },
        orderBy: { folio: "desc" },
        select: { id: true, folio: true },
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Préstamo — {prestamo.cliente.nombreCompleto}
          </h1>
          <Badge variant={activo ? "default" : "success"}>{activo ? "Activo" : "Pagado"}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{prestamo.cliente.numeroIdentificacion}</p>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <StatCard label="Fecha" value={formatFecha(prestamo.fecha)} />
          <StatCard label="Monto original" value={formatCOP(prestamo.montoOriginal)} />
          <StatCard
            label="Saldo pendiente"
            value={formatCOP(prestamo.saldoPendiente)}
            tono={activo ? "warning" : "success"}
          />
          {prestamo.contrato && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Contrato asociado</p>
              <Link href={`/contratos/${prestamo.contratoId}`} className="text-sm font-medium text-primary hover:underline">
                {formatFolioContrato(prestamo.contrato.folio)}
              </Link>
            </div>
          )}
          {prestamo.motivo && (
            <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Motivo</p>
              <p className="text-sm text-foreground">{prestamo.motivo}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandCoins className="size-4 text-muted-foreground" />
            Abonos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prestamo.abonos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                      Todavía no hay abonos registrados.
                    </TableCell>
                  </TableRow>
                )}

                {prestamo.abonos.map((abono) => (
                  <TableRow key={abono.id}>
                    <TableCell>{formatFecha(abono.fecha)}</TableCell>
                    <TableCell className="tabular-nums">{formatCOP(abono.monto)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {activo && <AbonoForm prestamoId={prestamo.id} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="size-4 text-muted-foreground" />
            Transferencias a capital de contrato
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Nota</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prestamo.transferenciasCapital.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      Todavía no se ha transferido nada a un contrato.
                    </TableCell>
                  </TableRow>
                )}

                {prestamo.transferenciasCapital.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{formatFecha(t.fecha)}</TableCell>
                    <TableCell>
                      <Link href={`/contratos/${t.contrato.id}`} className="font-medium text-primary hover:underline">
                        {formatFolioContrato(t.contrato.folio)}
                      </Link>
                    </TableCell>
                    <TableCell className="tabular-nums">{formatCOP(t.monto)}</TableCell>
                    <TableCell className="text-muted-foreground">{t.notas ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {activo &&
            (contratosCliente.length > 0 ? (
              <TransferenciaCapitalForm
                prestamoId={prestamo.id}
                saldoPendiente={prestamo.saldoPendiente}
                contratos={contratosCliente}
                contratoIdInicial={prestamo.contratoId ?? undefined}
              />
            ) : (
              <p className="border-t border-border pt-4 text-sm text-muted-foreground">
                Este cliente no tiene contratos activos a los que transferir el préstamo.
              </p>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
