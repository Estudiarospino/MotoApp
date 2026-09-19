import Link from "next/link";
import { cn } from "cn";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  PieChart,
  Pencil,
  Receipt,
  Wallet,
  Wrench,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCOP, sumarPesos } from "@/lib/money";
import { formatFecha } from "@/lib/format";
import { construirFiltroGastos, type GastosSearchParams } from "@/lib/gastos-filtro";
import { calcularTendenciaPct } from "@/lib/stats";
import { buttonVariants } from "@/components/ui/button";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { IconStatCard } from "@/components/icon-stat-card";
import { PageHeader } from "@/components/page-header";
import { GastosFilters } from "@/components/gastos/gastos-filters";
import { PorPaginaSelect } from "@/components/por-pagina-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GastoDialog } from "./gasto-dialog";
import { EliminarGastoButton } from "./eliminar-gasto-button";
import type { VariantProps } from "class-variance-authority";

const CATEGORIA_LABEL = {
  MANTENIMIENTO: "Mantenimiento",
  REPARACION: "Reparación",
  SEGURO: "Seguro",
  IMPUESTOS: "Impuestos",
  OTRO: "Otro",
} as const;

const CATEGORIA_BADGE: Record<keyof typeof CATEGORIA_LABEL, VariantProps<typeof badgeVariants>["variant"]> = {
  MANTENIMIENTO: "info",
  REPARACION: "destructive",
  SEGURO: "success",
  IMPUESTOS: "warning",
  OTRO: "secondary",
};

const POR_PAGINA_DEFECTO = 10;

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<GastosSearchParams>;
}) {
  const sp = await searchParams;
  const { where, orderBy, q, fechaDesde, fechaHasta, categoria, motocicletaId, estado, orden } =
    construirFiltroGastos(sp);
  const pagina = Math.max(1, Number(sp.page) || 1);
  const porPagina = Number(sp.porPagina) || POR_PAGINA_DEFECTO;

  const ahora = new Date();
  const inicioMesActual = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1));
  const inicioMesAnterior = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - 1, 1));

  const [totalFiltrado, gastos, motos, gastosMesActual, gastosMesAnterior, gastoMayor, porCategoria] =
    await Promise.all([
      prisma.gasto.count({ where }),
      prisma.gasto.findMany({
        where,
        orderBy,
        skip: (pagina - 1) * porPagina,
        take: porPagina,
        include: {
          motocicleta: { select: { placa: true, marca: true, modelo: true } },
          documentos: { select: { id: true }, take: 1 },
        },
      }),
      prisma.motocicleta.findMany({ orderBy: { placa: "asc" }, select: { id: true, placa: true, marca: true, modelo: true } }),
      prisma.gasto.findMany({ where: { fecha: { gte: inicioMesActual } }, select: { monto: true } }),
      prisma.gasto.findMany({
        where: { fecha: { gte: inicioMesAnterior, lt: inicioMesActual } },
        select: { monto: true },
      }),
      prisma.gasto.findFirst({ orderBy: { monto: "desc" }, select: { monto: true, descripcion: true, fecha: true } }),
      prisma.gasto.groupBy({ by: ["categoria"], _sum: { monto: true }, _count: { _all: true } }),
    ]);

  const totalGeneral = sumarPesos(...porCategoria.map((c) => c._sum.monto ?? 0));
  const totalRegistros = porCategoria.reduce((total, c) => total + c._count._all, 0);
  const totalMesActual = sumarPesos(...gastosMesActual.map((g) => g.monto));
  const totalMesAnterior = sumarPesos(...gastosMesAnterior.map((g) => g.monto));
  const categoriaPrincipal = porCategoria.reduce<(typeof porCategoria)[number] | null>(
    (max, c) => ((c._sum.monto ?? 0) > (max?._sum.monto ?? 0) ? c : max),
    null,
  );

  const tendenciaTotal = calcularTendenciaPct(totalMesActual, totalMesAnterior);
  const tendenciaRegistros = calcularTendenciaPct(gastosMesActual.length, gastosMesAnterior.length);

  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / porPagina));

  function queryActual(): Record<string, string> {
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (fechaDesde) params.fechaDesde = fechaDesde;
    if (fechaHasta) params.fechaHasta = fechaHasta;
    if (categoria !== "todas") params.categoria = categoria;
    if (motocicletaId !== "todas") params.motocicletaId = motocicletaId;
    if (estado !== "todos") params.estado = estado;
    if (orden !== "fecha_desc") params.orden = orden;
    return params;
  }

  function hrefPagina(p: number): string {
    const params = new URLSearchParams(queryActual());
    if (porPagina !== POR_PAGINA_DEFECTO) params.set("porPagina", porPagina.toString());
    params.set("page", p.toString());
    return `/gastos?${params.toString()}`;
  }

  function hrefOrden(siguiente: string): string {
    const params = new URLSearchParams(queryActual());
    if (siguiente === "fecha_desc") {
      params.delete("orden");
    } else {
      params.set("orden", siguiente);
    }
    return `/gastos?${params.toString()}`;
  }

  function iconoOrden(campo: "fecha" | "monto") {
    if (!orden.startsWith(campo)) return <ArrowUpDown className="size-3.5 text-muted-foreground" />;
    return orden.endsWith("asc") ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />;
  }

  const exportHref = `/api/gastos/export?${new URLSearchParams(queryActual()).toString()}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Gastos" }]}
        title="Gastos"
        subtitle="Mantenimiento, reparaciones y otros costos de la flota."
        actions={
          <>
            <a href={exportHref} className={cn(buttonVariants({ variant: "outline" }), "hidden sm:inline-flex")}>
              <Download data-icon="inline-start" className="size-4" />
              Exportar
            </a>
            <GastoDialog
              defaultOpen={sp.nuevo === "1"}
              motos={motos}
              motocicletaIdInicial={motocicletaId !== "todas" ? motocicletaId : undefined}
            />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <IconStatCard
          icon={Wallet}
          label="Total gastado"
          value={formatCOP(totalGeneral)}
          tono="neutral"
          tendenciaPct={tendenciaTotal}
          tendenciaInvertida
          hint="vs. mes anterior"
        />
        <IconStatCard
          icon={FileText}
          label="Registros"
          value={totalRegistros.toString()}
          tendenciaPct={tendenciaRegistros}
          hint="vs. mes anterior"
        />
        <IconStatCard
          icon={Wrench}
          label="Mayor gasto"
          value={gastoMayor ? formatCOP(gastoMayor.monto) : "—"}
          hint={gastoMayor ? `${gastoMayor.descripcion} · ${formatFecha(gastoMayor.fecha)}` : "Sin registros"}
        />
        <IconStatCard
          icon={PieChart}
          label="Categoría principal"
          value={categoriaPrincipal ? CATEGORIA_LABEL[categoriaPrincipal.categoria] : "—"}
          hint={
            categoriaPrincipal
              ? `${formatCOP(categoriaPrincipal._sum.monto ?? 0)} · ${
                  totalGeneral === 0 ? 0 : Math.round(((categoriaPrincipal._sum.monto ?? 0) / totalGeneral) * 100)
                }% del total`
              : "Sin registros"
          }
        />
      </div>

      <GastosFilters
        basePath="/gastos"
        valores={{ q, fechaDesde, fechaHasta, categoria, motocicletaId, estado }}
        motos={motos}
      />

      {gastos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Receipt className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {totalRegistros === 0 ? "Todavía no hay gastos registrados." : "Ningún gasto coincide con los filtros."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Móvil: lista de tarjetas táctiles */}
          <div className="flex flex-col gap-1 sm:hidden">
            {gastos.map((gasto) => (
              <div key={gasto.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{gasto.descripcion}</p>
                  <p className="text-xs text-muted-foreground">
                    {gasto.motocicleta.placa} — {gasto.motocicleta.marca} {gasto.motocicleta.modelo}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatFecha(gasto.fecha)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant={CATEGORIA_BADGE[gasto.categoria]}>{CATEGORIA_LABEL[gasto.categoria]}</Badge>
                  <span className="text-sm font-medium tabular-nums text-foreground">{formatCOP(gasto.monto)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Escritorio: tabla completa */}
          <div className="hidden overflow-x-auto rounded-lg border border-border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Link href={hrefOrden(orden === "fecha_desc" ? "fecha_asc" : "fecha_desc")} className="flex items-center gap-1 hover:text-foreground">
                      Fecha {iconoOrden("fecha")}
                    </Link>
                  </TableHead>
                  <TableHead>Motocicleta</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="hidden lg:table-cell">Comprobante</TableHead>
                  <TableHead>
                    <Link href={hrefOrden(orden === "monto_desc" ? "monto_asc" : "monto_desc")} className="flex items-center gap-1 hover:text-foreground">
                      Monto {iconoOrden("monto")}
                    </Link>
                  </TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gastos.map((gasto) => (
                  <TableRow key={gasto.id}>
                    <TableCell>{formatFecha(gasto.fecha)}</TableCell>
                    <TableCell>
                      {gasto.motocicleta.placa} — {gasto.motocicleta.marca} {gasto.motocicleta.modelo}
                    </TableCell>
                    <TableCell>
                      <Badge variant={CATEGORIA_BADGE[gasto.categoria]}>{CATEGORIA_LABEL[gasto.categoria]}</Badge>
                    </TableCell>
                    <TableCell className="max-w-64 truncate">{gasto.descripcion}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {gasto.documentos.length > 0 ? (
                        <Badge variant="success">Con comprobante</Badge>
                      ) : (
                        <Badge variant="secondary">Sin comprobante</Badge>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">{formatCOP(gasto.monto)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/gastos/${gasto.id}`}
                          aria-label="Ver gasto"
                          className={buttonVariants({ variant: "outline", size: "icon-sm" })}
                        >
                          <Eye className="size-4" />
                        </Link>
                        <Link
                          href={`/gastos/${gasto.id}`}
                          aria-label="Editar gasto"
                          className={buttonVariants({ variant: "outline", size: "icon-sm" })}
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <EliminarGastoButton gastoId={gasto.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Mostrando {(pagina - 1) * porPagina + 1} a {Math.min(pagina * porPagina, totalFiltrado)} de {totalFiltrado}{" "}
              registro{totalFiltrado === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Link
                  href={hrefPagina(Math.max(1, pagina - 1))}
                  aria-disabled={pagina === 1}
                  className={buttonVariants({
                    variant: "outline",
                    size: "icon-sm",
                    className: pagina === 1 ? "pointer-events-none opacity-40" : "",
                  })}
                >
                  <ChevronLeft className="size-4" />
                </Link>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={hrefPagina(p)}
                    className={buttonVariants({ variant: p === pagina ? "default" : "outline", size: "icon-sm" })}
                  >
                    {p}
                  </Link>
                ))}
                <Link
                  href={hrefPagina(Math.min(totalPaginas, pagina + 1))}
                  aria-disabled={pagina === totalPaginas}
                  className={buttonVariants({
                    variant: "outline",
                    size: "icon-sm",
                    className: pagina === totalPaginas ? "pointer-events-none opacity-40" : "",
                  })}
                >
                  <ChevronRight className="size-4" />
                </Link>
              </div>
              <PorPaginaSelect basePath="/gastos" query={queryActual()} valor={porPagina} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
