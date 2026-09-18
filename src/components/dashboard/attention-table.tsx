import Link from "next/link";
import { AlertTriangle, ChevronRight, FileText } from "lucide-react";
import { formatCOP } from "@/lib/money";
import { diasDesde, formatFolioContrato } from "@/lib/format";
import { estadoContratoInfo } from "@/lib/contrato-estado";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ContratoAtencion = {
  id: string;
  folio: number;
  moraAcumulada: number;
  fechaAperturaPeriodoActual: Date;
  estado: string;
  cliente: { nombreCompleto: string };
  motocicleta: { placa: string };
};

export function AttentionTable({ contratos }: { contratos: ContratoAtencion[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-warning" />
          Contratos que necesitan atención
        </CardTitle>
        {contratos.length > 0 && (
          <Link href="/contratos" className="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline">
            Ver todos <ChevronRight className="size-3.5" />
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {contratos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <FileText className="size-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Ningún contrato activo tiene mora ni un periodo abierto hace mucho. Todo al día.
            </p>
          </div>
        ) : (
          <>
            {/* Móvil: lista de tarjetas táctiles */}
            <div className="flex flex-col gap-1 sm:hidden">
              {contratos.map((contrato) => {
                const estado = estadoContratoInfo(contrato);
                const dias = diasDesde(contrato.fechaAperturaPeriodoActual);
                return (
                  <Link
                    key={contrato.id}
                    href={`/contratos/${contrato.id}`}
                    className="flex items-center gap-3 rounded-lg px-1 py-2.5 hover:bg-muted"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
                      <FileText className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{contrato.cliente.nombreCompleto}</p>
                      <p className="text-xs text-muted-foreground">{contrato.motocicleta.placa}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge variant={estado.variant}>{estado.label}</Badge>
                      <p className="mt-0.5 text-sm font-medium tabular-nums text-foreground">
                        {formatCOP(contrato.moraAcumulada)}
                      </p>
                      <p className="text-xs text-muted-foreground">{dias} días</p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>

            {/* Escritorio: tabla */}
            <div className="hidden overflow-x-auto rounded-lg border border-border sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Folio</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Moto</TableHead>
                    <TableHead>Mora</TableHead>
                    <TableHead className="hidden sm:table-cell">Días</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratos.map((contrato) => {
                    const estado = estadoContratoInfo(contrato);
                    const dias = diasDesde(contrato.fechaAperturaPeriodoActual);
                    return (
                      <TableRow key={contrato.id}>
                        <TableCell className="font-medium">{formatFolioContrato(contrato.folio)}</TableCell>
                        <TableCell>{contrato.cliente.nombreCompleto}</TableCell>
                        <TableCell className="hidden sm:table-cell">{contrato.motocicleta.placa}</TableCell>
                        <TableCell className="tabular-nums">{formatCOP(contrato.moraAcumulada)}</TableCell>
                        <TableCell className="hidden sm:table-cell">{dias}</TableCell>
                        <TableCell>
                          <Badge variant={estado.variant}>{estado.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/contratos/${contrato.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                            Ver
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
