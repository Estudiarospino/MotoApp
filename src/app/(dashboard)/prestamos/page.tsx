import Link from "next/link";
import { cn } from "cn";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  Eye,
  HandCoins,
  Pencil,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCOP, restarPesos, sumarPesos } from "@/lib/money";
import { formatFecha } from "@/lib/format";
import { calcularTendenciaPct } from "@/lib/stats";
import { construirFiltroPrestamos, type PrestamosSearchParams } from "@/lib/prestamos-filtro";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { IconStatCard } from "@/components/icon-stat-card";
import { PageHeader } from "@/components/page-header";
import { PrestamosFilters } from "@/components/prestamos/prestamos-filters";
import { PorPaginaSelect } from "@/components/por-pagina-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PrestamoDialog } from "./prestamo-dialog";
import { PrestamoMoreMenu } from "./prestamo-more-menu";

const POR_PAGINA_DEFECTO = 10;

export default async function PrestamosPage({
  searchParams,
}: {
  searchParams: Promise<PrestamosSearchParams>;
}) {
  const sp = await searchParams;
  const { where, orderBy, q, estado, fechaDesde, fechaHasta, orden } = construirFiltroPrestamos(sp);
  const pagina = Math.max(1, Number(sp.page) || 1);
  const porPagina = Number(sp.porPagina) || POR_PAGINA_DEFECTO;

  const ahora = new Date();
  const inicioMesActual = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1));
  const inicioMesAnterior = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - 1, 1));

  const [
    totalFiltrado,
    prestamos,
    clientesActivos,
    motos,
    metodosPago,
    totalClientes,
    prestamosActivos,
    agregadoGeneral,
    clientesConPrestamo,
    prestamosMesActual,
    prestamosMesAnterior,
    abonosMesActual,
    abonosMesAnterior,
  ] = await Promise.all([
    prisma.prestamo.count({ where }),
    prisma.prestamo.findMany({
      where,
      orderBy,
      skip: (pagina - 1) * porPagina,
      take: porPagina,
      include: { cliente: { select: { nombreCompleto: true } } },
    }),
    prisma.cliente.findMany({
      where: { activo: true },
      orderBy: { nombreCompleto: "asc" },
      select: { id: true, nombreCompleto: true, numeroIdentificacion: true },
    }),
    prisma.motocicleta.findMany({ orderBy: { placa: "asc" }, select: { id: true, placa: true, marca: true, modelo: true } }),
    prisma.metodoPago.findMany({ where: { activo: true }, orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
    prisma.cliente.count(),
    prisma.prestamo.count({ where: { estado: "ACTIVO" } }),
    prisma.prestamo.aggregate({ _sum: { saldoPendiente: true, montoOriginal: true }, _count: { _all: true } }),
    prisma.prestamo.findMany({ distinct: ["clienteId"], select: { clienteId: true } }),
    prisma.prestamo.findMany({ where: { fecha: { gte: inicioMesActual } }, select: { montoOriginal: true } }),
    prisma.prestamo.findMany({
      where: { fecha: { gte: inicioMesAnterior, lt: inicioMesActual } },
      select: { montoOriginal: true },
    }),
    prisma.abonoPrestamo.aggregate({ _sum: { monto: true }, where: { fecha: { gte: inicioMesActual } } }),
    prisma.abonoPrestamo.aggregate({
      _sum: { monto: true },
      where: { fecha: { gte: inicioMesAnterior, lt: inicioMesActual } },
    }),
  ]);

  const saldoPendienteTotal = agregadoGeneral._sum.saldoPendiente ?? 0;
  const totalPrestado = agregadoGeneral._sum.montoOriginal ?? 0;

  const prestadoEsteMes = sumarPesos(...prestamosMesActual.map((p) => p.montoOriginal));
  const prestadoMesAnterior = sumarPesos(...prestamosMesAnterior.map((p) => p.montoOriginal));
  const abonadoEsteMes = abonosMesActual._sum.monto ?? 0;
  const abonadoMesAnterior = abonosMesAnterior._sum.monto ?? 0;
  const netoEsteMes = restarPesos(prestadoEsteMes, abonadoEsteMes);
  const netoMesAnterior = restarPesos(prestadoMesAnterior, abonadoMesAnterior);

  const tendenciaActivos = calcularTendenciaPct(prestamosMesActual.length, prestamosMesAnterior.length);
  const tendenciaSaldo = calcularTendenciaPct(netoEsteMes, netoMesAnterior);
  const tendenciaTotalPrestado = calcularTendenciaPct(prestadoEsteMes, prestadoMesAnterior);
  const pctClientesConPrestamo = totalClientes === 0 ? 0 : Math.round((clientesConPrestamo.length / totalClientes) * 100);

  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / porPagina));

  function queryActual(): Record<string, string> {
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (estado !== "todos") params.estado = estado;
    if (fechaDesde) params.fechaDesde = fechaDesde;
    if (fechaHasta) params.fechaHasta = fechaHasta;
    if (orden !== "fecha_desc") params.orden = orden;
    return params;
  }

  function hrefPagina(p: number): string {
    const params = new URLSearchParams(queryActual());
    if (porPagina !== POR_PAGINA_DEFECTO) params.set("porPagina", porPagina.toString());
    params.set("page", p.toString());
    return `/prestamos?${params.toString()}`;
  }

  function hrefOrden(siguiente: string): string {
    const params = new URLSearchParams(queryActual());
    if (siguiente === "fecha_desc") {
      params.delete("orden");
    } else {
      params.set("orden", siguiente);
    }
    return `/prestamos?${params.toString()}`;
  }

  function iconoOrden() {
    if (orden !== "fecha_asc") return <ArrowDown className="size-3.5" />;
    return <ArrowUp className="size-3.5" />;
  }

  const exportHref = `/api/prestamos/export?${new URLSearchParams(queryActual()).toString()}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Préstamos" }]}
        title="Préstamos"
        subtitle="Ledger de préstamos a clientes, independiente del arriendo."
        actions={
          <>
            <a href={exportHref} className={cn(buttonVariants({ variant: "outline" }), "hidden sm:inline-flex")}>
              <Download data-icon="inline-start" className="size-4" />
              Exportar
            </a>
            <PrestamoDialog defaultOpen={sp.nuevo === "1"} clientes={clientesActivos} motos={motos} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <IconStatCard
          icon={HandCoins}
          label="Préstamos activos"
          value={prestamosActivos.toString()}
          tendenciaPct={tendenciaActivos}
          hint="vs. mes anterior"
        />
        <IconStatCard
          icon={Database}
          label="Saldo pendiente total"
          value={formatCOP(saldoPendienteTotal)}
          tendenciaPct={tendenciaSaldo}
          tendenciaInvertida
          hint="vs. mes anterior"
        />
        <IconStatCard
          icon={CheckCircle2}
          label="Total prestado"
          value={formatCOP(totalPrestado)}
          tendenciaPct={tendenciaTotalPrestado}
          tendenciaInvertida
          hint="vs. mes anterior"
        />
        <IconStatCard
          icon={Users}
          label="Clientes con préstamo"
          value={clientesConPrestamo.length.toString()}
          hint={`${pctClientesConPrestamo}% de tus clientes`}
        />
      </div>

      <PrestamosFilters basePath="/prestamos" valores={{ q, estado, fechaDesde, fechaHasta }} />

      {prestamos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <HandCoins className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {agregadoGeneral._count._all === 0
                ? "Todavía no hay préstamos registrados."
                : "Ningún préstamo coincide con los filtros."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Móvil: lista de tarjetas táctiles */}
          <div className="flex flex-col gap-1 sm:hidden">
            {prestamos.map((prestamo) => (
              <Link
                key={prestamo.id}
                href={`/prestamos/${prestamo.id}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{prestamo.cliente.nombreCompleto}</p>
                  <p className="text-xs text-muted-foreground">{formatFecha(prestamo.fecha)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant={prestamo.estado === "ACTIVO" ? "info" : "success"}>
                    {prestamo.estado === "ACTIVO" ? "Activo" : "Pagado"}
                  </Badge>
                  <span className="text-sm font-medium tabular-nums text-foreground">
                    {formatCOP(prestamo.saldoPendiente)}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Escritorio: tabla completa */}
          <div className="hidden overflow-x-auto rounded-lg border border-border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Link
                      href={hrefOrden(orden === "fecha_asc" ? "fecha_desc" : "fecha_asc")}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      Fecha {iconoOrden()}
                    </Link>
                  </TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto original</TableHead>
                  <TableHead>Saldo pendiente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prestamos.map((prestamo) => (
                  <TableRow key={prestamo.id}>
                    <TableCell>{formatFecha(prestamo.fecha)}</TableCell>
                    <TableCell className="font-medium text-foreground">{prestamo.cliente.nombreCompleto}</TableCell>
                    <TableCell className="tabular-nums">{formatCOP(prestamo.montoOriginal)}</TableCell>
                    <TableCell className="tabular-nums">{formatCOP(prestamo.saldoPendiente)}</TableCell>
                    <TableCell>
                      <Badge variant={prestamo.estado === "ACTIVO" ? "info" : "success"}>
                        {prestamo.estado === "ACTIVO" ? "Activo" : "Pagado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/prestamos/${prestamo.id}`}
                          aria-label="Ver préstamo"
                          className={buttonVariants({ variant: "outline", size: "icon-sm" })}
                        >
                          <Eye className="size-4" />
                        </Link>
                        <Link
                          href={`/prestamos/${prestamo.id}`}
                          aria-label="Gestionar préstamo"
                          className={buttonVariants({ variant: "outline", size: "icon-sm" })}
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <PrestamoMoreMenu
                          prestamoId={prestamo.id}
                          activo={prestamo.estado === "ACTIVO"}
                          metodosPago={metodosPago}
                        />
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
              <PorPaginaSelect basePath="/prestamos" query={queryActual()} valor={porPagina} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
