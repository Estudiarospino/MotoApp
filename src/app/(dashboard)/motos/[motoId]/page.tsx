import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Plus, Trash2, Wrench } from "lucide-react";
import { MobilePageHeader } from "@/components/dashboard/mobile-page-header";
import { prisma } from "@/lib/db";
import { formatCOP, restarPesos, sumarPesos } from "@/lib/money";
import { formatFecha, toFechaInputValue } from "@/lib/format";
import {
  estadoVencimiento,
  VIGENCIA_SOAT_MESES,
  VIGENCIA_TECNOMECANICA_MESES,
} from "@/lib/moto-documentos";
import { buttonVariants, Button } from "@/components/ui/button";
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
import { MotoForm } from "../moto-form";
import { updateMotocicleta } from "../actions";
import { deleteGasto } from "../../gastos/actions";

const CATEGORIA_LABEL = {
  MANTENIMIENTO: "Mantenimiento",
  REPARACION: "Reparación",
  SEGURO: "Seguro",
  IMPUESTOS: "Impuestos",
  OTRO: "Otro",
} as const;

export default async function EditarMotoPage({
  params,
}: {
  params: Promise<{ motoId: string }>;
}) {
  const { motoId } = await params;
  const [moto, gastos, periodosCierre] = await Promise.all([
    prisma.motocicleta.findUnique({ where: { id: motoId } }),
    prisma.gasto.findMany({ where: { motocicletaId: motoId }, orderBy: { fecha: "desc" } }),
    prisma.periodoCierre.findMany({
      where: { contrato: { motocicletaId: motoId } },
      select: { arriendoCubierto: true, abonoCapital: true },
    }),
  ]);

  if (!moto) {
    notFound();
  }

  const actionConId = updateMotocicleta.bind(null, moto.id);
  const estadoSoat = estadoVencimiento(moto.soatFechaExpedicion, VIGENCIA_SOAT_MESES);
  const estadoTecnomecanica = estadoVencimiento(moto.tecnomecanicaFechaExpedicion, VIGENCIA_TECNOMECANICA_MESES);
  const totalGastos = sumarPesos(...gastos.map((g) => g.monto));
  const totalCobrado = sumarPesos(
    ...periodosCierre.map((p) => sumarPesos(p.arriendoCubierto, p.abonoCapital)),
  );
  const utilidadNeta = restarPesos(totalCobrado, totalGastos);

  return (
    <div className="flex flex-col gap-6">
      <MobilePageHeader title={`${moto.placa} — ${moto.marca} ${moto.modelo}`} backHref="/motos" />

      <nav className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>
        <ChevronRight className="size-3" />
        <Link href="/motos" className="hover:text-foreground">
          Motocicletas
        </Link>
        <ChevronRight className="size-3" />
        <span className="font-medium text-foreground">{moto.placa}</span>
      </nav>

      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Editar moto</h1>
        <Card className="max-w-2xl">
          <CardContent>
            <MotoForm
              action={actionConId}
              valoresIniciales={{
                marca: moto.marca,
                modelo: moto.modelo,
                placa: moto.placa,
                color: moto.color ?? undefined,
                anioModelo: moto.anioModelo?.toString(),
                precioInicial: moto.precioInicial.toString(),
                soatFechaExpedicion: moto.soatFechaExpedicion
                  ? toFechaInputValue(moto.soatFechaExpedicion)
                  : undefined,
                tecnomecanicaFechaExpedicion: moto.tecnomecanicaFechaExpedicion
                  ? toFechaInputValue(moto.tecnomecanicaFechaExpedicion)
                  : undefined,
                notas: moto.notas ?? undefined,
                fotoUrl: moto.fotoUrl ?? undefined,
              }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-foreground">Documentos legales</h2>
        <Card>
          <CardContent className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">SOAT</p>
              <Badge variant={estadoSoat.variant} className="w-fit">
                {estadoSoat.label}
              </Badge>
              {estadoSoat.vencimiento && (
                <p className="text-xs text-muted-foreground">Vence: {formatFecha(estadoSoat.vencimiento)}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Revisión tecnomecánica</p>
              <Badge variant={estadoTecnomecanica.variant} className="w-fit">
                {estadoTecnomecanica.label}
              </Badge>
              {estadoTecnomecanica.vencimiento && (
                <p className="text-xs text-muted-foreground">
                  Vence: {formatFecha(estadoTecnomecanica.vencimiento)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground">Rentabilidad</h2>
          <Link href={`/gastos?nuevo=1&motocicletaId=${moto.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Plus data-icon="inline-start" className="size-4" />
            Nuevo gasto
          </Link>
        </div>

        <Card>
          <CardContent className="grid grid-cols-3 gap-6">
            <StatCard label="Cobrado (periodos cerrados)" value={formatCOP(totalCobrado)} />
            <StatCard label="Gastos totales" value={formatCOP(totalGastos)} />
            <StatCard
              label="Utilidad neta"
              value={formatCOP(utilidadNeta)}
              tono={utilidadNeta >= 0 ? "success" : "destructive"}
            />
          </CardContent>
        </Card>

        {gastos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <Wrench className="size-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Todavía no hay gastos registrados para esta moto.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Categoría</TableHead>
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
                      <TableCell>{CATEGORIA_LABEL[gasto.categoria]}</TableCell>
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
    </div>
  );
}
