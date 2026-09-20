import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, CreditCard, Download, Plus, Receipt, Search, Users, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCOP } from "@/lib/money";
import { formatFecha, formatFolioContrato } from "@/lib/format";
import { construirFiltroPagos, type PagosSearchParams } from "@/lib/pagos-filtro";
import { buttonVariants } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { IconStatCard } from "@/components/icon-stat-card";
import { PageHeader } from "@/components/page-header";
import { PorPaginaSelect } from "@/components/por-pagina-select";
import { PagosFilters } from "@/components/pagos/pagos-filters";
import { RegistrarPagoPicker } from "@/components/pagos/registrar-pago-picker";
import { PagosTable, type PagoRow } from "@/components/pagos/pagos-table";

const POR_PAGINA_DEFECTO = 10;

function inicioDeMes(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), 1));
}

function tendenciaPct(actual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return Math.round(((actual - anterior) / anterior) * 100);
}

export default async function PagosPage({ searchParams }: { searchParams: Promise<PagosSearchParams> }) {
  const sp = await searchParams;
  const { where, orderBy, q, tipo, metodoPagoId, estado, fecha } = construirFiltroPagos(sp);
  const pagina = Math.max(1, Number(sp.page) || 1);
  const porPagina = Number(sp.porPagina) || POR_PAGINA_DEFECTO;

  const ahora = new Date();
  const esteMes = inicioDeMes(ahora);
  const mesAnterior = new Date(Date.UTC(esteMes.getUTCFullYear(), esteMes.getUTCMonth() - 1, 1));

  const [
    totalContratos,
    totalPagos,
    montoTotalAgg,
    pagosEsteMes,
    pagosMesAnterior,
    contratosConPagos,
    contratosActivos,
    metodosPago,
    totalFiltrado,
    pagos,
  ] = await Promise.all([
    prisma.contrato.count(),
    prisma.pago.count(),
    prisma.pago.aggregate({ _sum: { monto: true } }),
    prisma.pago.aggregate({ _count: true, _sum: { monto: true }, where: { fecha: { gte: esteMes } } }),
    prisma.pago.aggregate({
      _count: true,
      _sum: { monto: true },
      where: { fecha: { gte: mesAnterior, lt: esteMes } },
    }),
    prisma.pago.findMany({ distinct: ["contratoId"], select: { contratoId: true } }),
    prisma.contrato.findMany({
      where: { estado: "ACTIVO" },
      orderBy: { folio: "desc" },
      select: {
        id: true,
        folio: true,
        saldoCapitalPendiente: true,
        cliente: { select: { nombreCompleto: true } },
        motocicleta: { select: { placa: true, marca: true, modelo: true } },
      },
    }),
    prisma.metodoPago.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.pago.count({ where }),
    prisma.pago.findMany({
      where,
      orderBy,
      skip: (pagina - 1) * porPagina,
      take: porPagina,
      include: {
        contrato: { select: { id: true, folio: true, cliente: { select: { id: true, nombreCompleto: true } } } },
        metodoPago: { select: { nombre: true } },
      },
    }),
  ]);

  const montoTotal = montoTotalAgg._sum.monto ?? 0;
  const pagoPromedio = totalPagos > 0 ? Math.round(montoTotal / totalPagos) : 0;

  const filas: PagoRow[] = pagos.map((pago) => ({
    id: pago.id,
    tipo: pago.tipo,
    fechaLabel: formatFecha(pago.fecha),
    contratoId: pago.contrato.id,
    folio: pago.contrato.folio,
    clienteId: pago.contrato.cliente.id,
    clienteNombre: pago.contrato.cliente.nombreCompleto,
    metodoNombre: pago.metodoPago.nombre,
    monto: pago.monto,
    periodoCierreId: pago.periodoCierreId,
  }));

  const contratosParaPicker = contratosActivos.map((c) => ({
    id: c.id,
    folio: c.folio,
    clienteNombre: c.cliente.nombreCompleto,
    motoNombre: `${c.motocicleta.placa} — ${c.motocicleta.marca} ${c.motocicleta.modelo}`,
    saldoCapitalPendiente: c.saldoCapitalPendiente,
  }));

  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / porPagina));

  function queryActual(): Record<string, string> {
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (tipo !== "todos") params.tipo = tipo;
    if (metodoPagoId !== "todos") params.metodoPagoId = metodoPagoId;
    if (estado !== "todos") params.estado = estado;
    if (fecha !== "todas") params.fecha = fecha;
    return params;
  }

  function hrefPagina(p: number): string {
    const params = new URLSearchParams(queryActual());
    if (porPagina !== POR_PAGINA_DEFECTO) params.set("porPagina", porPagina.toString());
    params.set("page", p.toString());
    return `/pagos?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Pagos y recibos" }]}
        title="Pagos y recibos"
        subtitle="Historial de pagos registrados. Cada pago se aplica desde el contrato correspondiente."
        actions={
          <>
            <Link href="/pagos/calendario" className={buttonVariants({ variant: "outline" })}>
              <CalendarDays data-icon="inline-start" className="size-4" />
              Calendario
            </Link>
            <RegistrarPagoPicker
              contratos={contratosParaPicker}
              metodosPago={metodosPago}
              trigger={
                <DialogTrigger className={buttonVariants()}>
                  <Plus data-icon="inline-start" className="size-4" />
                  Registrar pago
                </DialogTrigger>
              }
            />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <IconStatCard
          icon={CreditCard}
          label="Total de pagos"
          value={totalPagos.toString()}
          hint="pagos registrados"
          tendenciaPct={tendenciaPct(pagosEsteMes._count, pagosMesAnterior._count)}
        />
        <IconStatCard
          icon={Wallet}
          label="Monto total recibido"
          value={formatCOP(montoTotal)}
          hint="en todos los periodos"
          tendenciaPct={tendenciaPct(pagosEsteMes._sum.monto ?? 0, pagosMesAnterior._sum.monto ?? 0)}
        />
        <IconStatCard icon={Receipt} label="Pago promedio" value={formatCOP(pagoPromedio)} hint="por transacción" />
        <IconStatCard
          icon={Users}
          label="Contratos con pagos"
          value={contratosConPagos.length.toString()}
          hint={`de ${totalContratos} contratos`}
        />
      </div>

      <PagosFilters basePath="/pagos" valores={{ q, tipo, metodoPagoId, estado, fecha }} metodosPago={metodosPago} />

      <Card>
        <CardContent>
          <p className="mb-1 text-sm font-medium text-foreground">Registrar un pago rápido</p>
          <p className="mb-3 text-xs text-muted-foreground">Selecciona un contrato reciente para registrar un nuevo pago.</p>
          {contratosParaPicker.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay contratos activos para registrar pagos.</p>
          ) : (
            <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
              {contratosParaPicker.slice(0, 5).map((c) => (
                <RegistrarPagoPicker
                  key={c.id}
                  contratos={contratosParaPicker}
                  metodosPago={metodosPago}
                  contratoIdInicial={c.id}
                  trigger={
                    <DialogTrigger
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                        className: "h-auto shrink-0 snap-start flex-col items-start gap-0 px-3 py-1.5 sm:shrink",
                      })}
                    >
                      <span className="font-semibold">{formatFolioContrato(c.folio)}</span>
                      <span className="font-normal text-muted-foreground">{c.clienteNombre}</span>
                    </DialogTrigger>
                  }
                />
              ))}
              <RegistrarPagoPicker
                contratos={contratosParaPicker}
                metodosPago={metodosPago}
                trigger={
                  <DialogTrigger
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className:
                        "h-auto shrink-0 snap-start items-center justify-center gap-1.5 self-stretch border-dashed px-3 py-1.5 text-muted-foreground hover:border-foreground/30 hover:text-foreground sm:shrink",
                    })}
                  >
                    <Search className="size-4" />
                    Buscar otro contrato
                  </DialogTrigger>
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Historial de pagos</p>
            <p className="text-xs text-muted-foreground">Mostrando los pagos registrados en el sistema.</p>
          </div>
          {pagos.length > 0 && (
            <a href={`/api/pagos/export?${new URLSearchParams(queryActual()).toString()}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Download data-icon="inline-start" className="size-4" />
              Exportar
            </a>
          )}
        </div>

        {pagos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <Receipt className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {totalPagos === 0 ? "Todavía no hay pagos registrados." : "Ningún pago coincide con los filtros."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <PagosTable pagos={filas} offset={(pagina - 1) * porPagina} />

            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Mostrando {(pagina - 1) * porPagina + 1} a {Math.min(pagina * porPagina, totalFiltrado)} de{" "}
                {totalFiltrado} pago{totalFiltrado === 1 ? "" : "s"}
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
                <PorPaginaSelect basePath="/pagos" query={queryActual()} valor={porPagina} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
