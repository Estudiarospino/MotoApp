import Link from "next/link";
import { Download, Eye, FileText } from "lucide-react";
import { formatCOP } from "@/lib/money";
import { formatFecha } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PeriodoPagosDialog, type PagoDePeriodo } from "@/components/contratos/periodo-pagos-dialog";

const TIPO_CIERRE_LABEL = {
  NORMAL: "Normal",
  COMPRA_ANTICIPADA: "Compra anticipada",
} as const;

export type PeriodoItem = {
  id: string;
  numeroPeriodo: number;
  tipoCierre: keyof typeof TIPO_CIERRE_LABEL;
  fechaCierre: Date;
  metaArriendo: number;
  cobradoPeriodo: number;
  abonoCapital: number;
  moraNueva: number;
  saldoCapitalNuevo: number;
  pagos: PagoDePeriodo[];
};

export function TabPeriodos({ periodos }: { periodos: PeriodoItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          Periodos cerrados
        </CardTitle>
      </CardHeader>
      <CardContent>
        {periodos.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Todavía no se ha cerrado ningún periodo de este contrato.
          </p>
        ) : (
          <>
            {/* Móvil: tarjetas apiladas */}
            <div className="flex flex-col gap-3 sm:hidden">
              {periodos.map((periodo) => (
                <div key={periodo.id} className="rounded-lg border border-border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Periodo {periodo.numeroPeriodo} · {TIPO_CIERRE_LABEL[periodo.tipoCierre]}
                    </span>
                    <div className="flex items-center gap-1">
                      <PeriodoPagosDialog
                        numeroPeriodo={periodo.numeroPeriodo}
                        pagos={periodo.pagos}
                        trigger={
                          <DialogTrigger aria-label="Ver pagos del periodo" className="text-muted-foreground hover:text-foreground">
                            <Eye className="size-4" />
                          </DialogTrigger>
                        }
                      />
                      <Link
                        href={`/api/recibos/${periodo.id}`}
                        target="_blank"
                        aria-label="Descargar recibo"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Download className="size-4" />
                      </Link>
                    </div>
                  </div>
                  <p className="mb-2 text-xs text-muted-foreground">Cerrado el {formatFecha(periodo.fechaCierre)}</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                    <Campo etiqueta="Meta" valor={formatCOP(periodo.metaArriendo)} />
                    <Campo etiqueta="Cobrado" valor={formatCOP(periodo.cobradoPeriodo)} />
                    <Campo etiqueta="Abono capital" valor={formatCOP(periodo.abonoCapital)} />
                    <Campo etiqueta="Mora nueva" valor={formatCOP(periodo.moraNueva)} />
                    <Campo etiqueta="Saldo nuevo" valor={formatCOP(periodo.saldoCapitalNuevo)} />
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-lg border border-border sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Cierre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Meta</TableHead>
                    <TableHead>Cobrado</TableHead>
                    <TableHead>Abono capital</TableHead>
                    <TableHead>Mora nueva</TableHead>
                    <TableHead>Saldo nuevo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periodos.map((periodo) => (
                    <TableRow key={periodo.id}>
                      <TableCell>{periodo.numeroPeriodo}</TableCell>
                      <TableCell>{formatFecha(periodo.fechaCierre)}</TableCell>
                      <TableCell>{TIPO_CIERRE_LABEL[periodo.tipoCierre]}</TableCell>
                      <TableCell className="tabular-nums">{formatCOP(periodo.metaArriendo)}</TableCell>
                      <TableCell className="tabular-nums">{formatCOP(periodo.cobradoPeriodo)}</TableCell>
                      <TableCell className="tabular-nums">{formatCOP(periodo.abonoCapital)}</TableCell>
                      <TableCell className="tabular-nums">{formatCOP(periodo.moraNueva)}</TableCell>
                      <TableCell className="tabular-nums">{formatCOP(periodo.saldoCapitalNuevo)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <PeriodoPagosDialog
                            numeroPeriodo={periodo.numeroPeriodo}
                            pagos={periodo.pagos}
                            trigger={
                              <DialogTrigger
                                aria-label="Ver pagos del periodo"
                                className="inline-flex text-muted-foreground hover:text-foreground"
                              >
                                <Eye className="size-4" />
                              </DialogTrigger>
                            }
                          />
                          <Link
                            href={`/api/recibos/${periodo.id}`}
                            target="_blank"
                            aria-label="Descargar recibo"
                            className="inline-flex text-muted-foreground hover:text-foreground"
                          >
                            <Download className="size-4" />
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Campo({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{etiqueta}</span>
      <span className="text-right font-medium text-foreground">{valor}</span>
    </div>
  );
}
