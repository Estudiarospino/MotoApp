import Link from "next/link";
import { cn } from "cn";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Download,
  FileX2,
  Landmark,
  Plus,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCOP, sumarPesos } from "@/lib/money";
import { formatFolioContrato } from "@/lib/format";
import { contratoEnAtrasoCritico, diasSinPagar, estadoContratoInfo } from "@/lib/contrato-estado";
import { colorAvatar, iniciales } from "@/lib/avatar";
import {
  construirFiltroCartera,
  filtrarAtrasoCriticoEnMemoria,
  type CarteraSearchParams,
} from "@/lib/cartera-filtro";
import { buttonVariants } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconStatCard } from "@/components/icon-stat-card";
import { PageHeader } from "@/components/page-header";
import { PorPaginaSelect } from "@/components/por-pagina-select";
import { CarteraFilters } from "@/components/cartera/cartera-filters";
import { RegistrarPagoDialog } from "@/components/contratos/registrar-pago-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const POR_PAGINA_DEFECTO = 10;

const BUCKETS: { key: string; label: string; min: number; max: number | null }[] = [
  { key: "b0_15", label: "0–15 días", min: 0, max: 15 },
  { key: "b16_30", label: "16–30 días", min: 16, max: 30 },
  { key: "b31_60", label: "31–60 días", min: 31, max: 60 },
  { key: "b61", label: "61+ días", min: 61, max: null },
];

export default async function CarteraPage({ searchParams }: { searchParams: Promise<CarteraSearchParams> }) {
  const sp = await searchParams;
  const { where, orderBy, q, estado, orden } = construirFiltroCartera(sp);
  const pagina = Math.max(1, Number(sp.page) || 1);
  const porPagina = Number(sp.porPagina) || POR_PAGINA_DEFECTO;

  const carteraCompleta = await prisma.contrato.findMany({
    where: { estado: "ACTIVO" },
    include: {
      cliente: { select: { nombreCompleto: true } },
      motocicleta: { select: { placa: true, marca: true, modelo: true } },
      pagos: { orderBy: { fecha: "desc" }, take: 1, select: { fecha: true } },
    },
  });

  let totalFiltrado: number;
  let contratos: typeof carteraCompleta;

  if (estado === "atraso_critico") {
    const filtrados = filtrarAtrasoCriticoEnMemoria(carteraCompleta, { q, orden });
    totalFiltrado = filtrados.length;
    contratos = filtrados.slice((pagina - 1) * porPagina, pagina * porPagina);
  } else {
    [totalFiltrado, contratos] = await Promise.all([
      prisma.contrato.count({ where }),
      prisma.contrato.findMany({
        where,
        orderBy,
        skip: (pagina - 1) * porPagina,
        take: porPagina,
        include: {
          cliente: { select: { nombreCompleto: true } },
          motocicleta: { select: { placa: true, marca: true, modelo: true } },
          pagos: { orderBy: { fecha: "desc" }, take: 1, select: { fecha: true } },
        },
      }),
    ]);
  }

  const metodosPago = await prisma.metodoPago.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });

  const carteraActivaTotal = sumarPesos(...carteraCompleta.map((c) => c.saldoCapitalPendiente));
  const moraTotal = sumarPesos(...carteraCompleta.map((c) => c.moraAcumulada));
  const enMora = carteraCompleta.filter((c) => c.moraAcumulada > 0);
  const atrasoCritico = enMora.filter((c) =>
    contratoEnAtrasoCritico({
      frecuenciaPago: c.frecuenciaPago,
      fechaInicio: c.fechaInicio,
      ultimoPagoFecha: c.pagos[0]?.fecha ?? null,
    }),
  );
  const pctMoraExacto = carteraActivaTotal === 0 ? 0 : (moraTotal / carteraActivaTotal) * 100;
  const pctMoraLabel =
    pctMoraExacto > 0 && pctMoraExacto < 1 ? "<1" : Math.round(pctMoraExacto).toString();

  const buckets = BUCKETS.map((b) => {
    const enBucket = enMora.filter((c) => {
      const dias = diasSinPagar({ fechaInicio: c.fechaInicio, ultimoPagoFecha: c.pagos[0]?.fecha ?? null });
      return dias >= b.min && (b.max === null || dias <= b.max);
    });
    return { ...b, cantidad: enBucket.length, mora: sumarPesos(...enBucket.map((c) => c.moraAcumulada)) };
  });

  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / porPagina));

  function queryActual(): Record<string, string> {
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (estado !== "todos") params.estado = estado;
    if (orden !== "mora_desc") params.orden = orden;
    return params;
  }

  function hrefPagina(p: number): string {
    const params = new URLSearchParams(queryActual());
    if (porPagina !== POR_PAGINA_DEFECTO) params.set("porPagina", porPagina.toString());
    params.set("page", p.toString());
    return `/cartera?${params.toString()}`;
  }

  function hrefOrden(siguiente: string): string {
    const params = new URLSearchParams(queryActual());
    if (siguiente === "mora_desc") {
      params.delete("orden");
    } else {
      params.set("orden", siguiente);
    }
    return `/cartera?${params.toString()}`;
  }

  function siguienteOrden(columna: "mora" | "saldo"): string {
    if (columna === "mora") return orden === "mora_desc" ? "mora_asc" : "mora_desc";
    return orden === "saldo_desc" ? "saldo_asc" : "saldo_desc";
  }

  function iconoOrden(columna: "mora" | "saldo") {
    const ordenDesc = columna === "mora" ? "mora_desc" : "saldo_desc";
    const ordenColumnaActiva = orden === ordenDesc || orden === (columna === "mora" ? "mora_asc" : "saldo_asc");
    if (!ordenColumnaActiva) return null;
    return orden.endsWith("_asc") ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />;
  }

  const exportHref = `/api/cartera/export?${new URLSearchParams(queryActual()).toString()}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Cartera" }]}
        title="Cartera"
        subtitle="Saldo pendiente y mora de los contratos activos."
        actions={
          <a href={exportHref} className={cn(buttonVariants({ variant: "outline" }))}>
            <Download data-icon="inline-start" className="size-4" />
            Exportar
          </a>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <IconStatCard
          icon={Landmark}
          label="Cartera activa"
          value={formatCOP(carteraActivaTotal)}
          hint={`en ${carteraCompleta.length} contrato${carteraCompleta.length === 1 ? "" : "s"} activos`}
        />
        <IconStatCard
          icon={Wallet}
          label="Cartera en mora"
          value={formatCOP(moraTotal)}
          tono={moraTotal > 0 ? "warning" : "success"}
          hint={`${pctMoraLabel}% del saldo de capital activo`}
        />
        <IconStatCard
          icon={AlertTriangle}
          label="Contratos en mora"
          value={enMora.length.toString()}
          tono={enMora.length > 0 ? "warning" : "success"}
          hint={`de ${carteraCompleta.length} activos`}
        />
        <IconStatCard
          icon={ShieldAlert}
          label="Atraso crítico"
          value={atrasoCritico.length.toString()}
          tono={atrasoCritico.length > 0 ? "destructive" : "success"}
          hint="sin pagar más de lo que permite su frecuencia"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Antigüedad de la mora</CardTitle>
        </CardHeader>
        <CardContent>
          {enMora.length === 0 ? (
            <p className="text-sm text-muted-foreground">Toda la cartera está al día.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {buckets.map((b) => (
                <div key={b.key} className="flex flex-col gap-1 border-l-2 border-border pl-3">
                  <p className="text-xs text-muted-foreground">{b.label}</p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {b.cantidad} contrato{b.cantidad === 1 ? "" : "s"}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">{formatCOP(b.mora)} en mora</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CarteraFilters basePath="/cartera" valores={{ q, estado }} />

      {contratos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <FileX2 className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {carteraCompleta.length === 0
                ? "No hay contratos activos en este momento."
                : "Ningún contrato coincide con los filtros."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Móvil: lista de tarjetas táctiles */}
          <div className="flex flex-col gap-1 sm:hidden">
            {contratos.map((contrato) => {
              const color = colorAvatar(contrato.clienteId);
              const estadoInfo = estadoContratoInfo(contrato);
              return (
                <Link
                  key={contrato.id}
                  href={`/contratos/${contrato.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3"
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${color.bg} ${color.text}`}
                  >
                    {iniciales(contrato.cliente.nombreCompleto)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{contrato.cliente.nombreCompleto}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFolioContrato(contrato.folio)} · {contrato.motocicleta.marca}{" "}
                      {contrato.motocicleta.modelo}
                    </p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      Saldo {formatCOP(contrato.saldoCapitalPendiente)}
                      {contrato.moraAcumulada > 0 && <> · Mora {formatCOP(contrato.moraAcumulada)}</>}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={estadoInfo.variant}>{estadoInfo.label}</Badge>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </div>

          {/* Escritorio: tabla completa */}
          <div className="hidden overflow-x-auto rounded-lg border border-border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">Motocicleta</TableHead>
                  <TableHead>
                    <Link
                      href={hrefOrden(siguienteOrden("saldo"))}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      Saldo capital {iconoOrden("saldo")}
                    </Link>
                  </TableHead>
                  <TableHead>
                    <Link
                      href={hrefOrden(siguienteOrden("mora"))}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      Mora acumulada {iconoOrden("mora")}
                    </Link>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Días sin pagar</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratos.map((contrato) => {
                  const color = colorAvatar(contrato.clienteId);
                  const estadoInfo = estadoContratoInfo(contrato);
                  const diasPeriodo = diasSinPagar({
                    fechaInicio: contrato.fechaInicio,
                    ultimoPagoFecha: contrato.pagos[0]?.fecha ?? null,
                  });
                  return (
                    <TableRow key={contrato.id}>
                      <TableCell className="font-medium">{formatFolioContrato(contrato.folio)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${color.bg} ${color.text}`}
                          >
                            {iniciales(contrato.cliente.nombreCompleto)}
                          </span>
                          <span className="font-medium text-foreground">{contrato.cliente.nombreCompleto}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <p className="text-foreground">
                          {contrato.motocicleta.marca} {contrato.motocicleta.modelo}
                        </p>
                        <p className="text-xs text-muted-foreground">{contrato.motocicleta.placa}</p>
                      </TableCell>
                      <TableCell className="tabular-nums">{formatCOP(contrato.saldoCapitalPendiente)}</TableCell>
                      <TableCell className="tabular-nums">
                        {contrato.moraAcumulada > 0 ? (
                          <span className="font-medium text-warning">{formatCOP(contrato.moraAcumulada)}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden tabular-nums lg:table-cell">{diasPeriodo} días</TableCell>
                      <TableCell>
                        <Badge variant={estadoInfo.variant}>{estadoInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <RegistrarPagoDialog
                            contratoId={contrato.id}
                            saldoCapitalPendiente={contrato.saldoCapitalPendiente}
                            metodosPago={metodosPago}
                            trigger={
                              <DialogTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
                                <Plus data-icon="inline-start" className="size-4" />
                                Pago
                              </DialogTrigger>
                            }
                          />
                          <Link
                            href={`/contratos/${contrato.id}`}
                            className={buttonVariants({ variant: "outline", size: "sm" })}
                          >
                            Ver
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Mostrando {(pagina - 1) * porPagina + 1} a {Math.min(pagina * porPagina, totalFiltrado)} de{" "}
              {totalFiltrado} contrato{totalFiltrado === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-3">
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
              <PorPaginaSelect basePath="/cartera" query={queryActual()} valor={porPagina} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
