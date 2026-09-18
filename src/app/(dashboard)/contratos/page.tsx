import Link from "next/link";
import { FileX2, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCOP, sumarPesos } from "@/lib/money";
import { diasDesde, formatFolioContrato } from "@/lib/format";
import { estadoContratoInfo, UMBRAL_PERIODO_ABIERTO_DIAS } from "@/lib/contrato-estado";
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

export default async function ContratosPage() {
  const contratos = await prisma.contrato.findMany({
    orderBy: { folio: "desc" },
    include: {
      cliente: { select: { nombreCompleto: true } },
      motocicleta: { select: { placa: true, marca: true, modelo: true } },
    },
  });

  const activos = contratos.filter((c) => c.estado === "ACTIVO");
  const enMora = activos.filter((c) => c.moraAcumulada > 0);
  const moraTotal = sumarPesos(...activos.map((c) => c.moraAcumulada));
  const periodosAtrasados = activos.filter(
    (c) => diasDesde(c.fechaAperturaPeriodoActual) > UMBRAL_PERIODO_ABIERTO_DIAS,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Contratos</h1>
          <p className="text-sm text-muted-foreground">Arrendamientos con opción de compra en curso.</p>
        </div>
        <Link href="/contratos/nuevo" className={buttonVariants()}>
          <Plus data-icon="inline-start" className="size-4" />
          Nuevo contrato
        </Link>
      </div>

      {activos.length > 0 && (
        <Card>
          <CardContent className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <StatCard label="Contratos activos" value={activos.length.toString()} />
            <StatCard
              label="En mora"
              value={enMora.length.toString()}
              tono={enMora.length > 0 ? "warning" : "success"}
            />
            <StatCard
              label="Mora total de cartera"
              value={formatCOP(moraTotal)}
              tono={moraTotal > 0 ? "warning" : "success"}
            />
            <StatCard
              label="Periodos abiertos hace mucho"
              value={periodosAtrasados.length.toString()}
              hint={`Más de ${UMBRAL_PERIODO_ABIERTO_DIAS} días`}
              tono={periodosAtrasados.length > 0 ? "warning" : "success"}
            />
          </CardContent>
        </Card>
      )}

      {contratos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <FileX2 className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Todavía no hay contratos registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Folio</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden sm:table-cell">Motocicleta</TableHead>
                <TableHead className="hidden sm:table-cell">Saldo capital</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contratos.map((contrato) => {
                const estado = estadoContratoInfo(contrato);
                return (
                  <TableRow key={contrato.id}>
                    <TableCell className="font-medium">{formatFolioContrato(contrato.folio)}</TableCell>
                    <TableCell>{contrato.cliente.nombreCompleto}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {contrato.motocicleta.placa} — {contrato.motocicleta.marca}{" "}
                      {contrato.motocicleta.modelo}
                    </TableCell>
                    <TableCell className="hidden tabular-nums sm:table-cell">
                      {formatCOP(contrato.saldoCapitalPendiente)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={estado.variant}>{estado.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/contratos/${contrato.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Ver
                      </Link>
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
