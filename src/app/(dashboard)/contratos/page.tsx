import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Bike,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileX2,
  Plus,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCOP, sumarPesos } from "@/lib/money";
import { diasDesde, formatFecha, formatFolioContrato } from "@/lib/format";
import { estadoContratoInfo, UMBRAL_PERIODO_ABIERTO_DIAS } from "@/lib/contrato-estado";
import { colorAvatar, iniciales } from "@/lib/avatar";
import { construirFiltroContratos, type ContratosSearchParams } from "@/lib/contratos-filtro";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { IconStatCard } from "@/components/icon-stat-card";
import { PageHeader } from "@/components/page-header";
import { ContratosFilters } from "@/components/contratos/contratos-filters";
import { PorPaginaSelect } from "@/components/por-pagina-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const POR_PAGINA_DEFECTO = 10;

export default async function ContratosPage({
  searchParams,
}: {
  searchParams: Promise<ContratosSearchParams>;
}) {
  const sp = await searchParams;
  const { where, orderBy, q, estado, marca, fechaCreacion } = construirFiltroContratos(sp);
  const pagina = Math.max(1, Number(sp.page) || 1);
  const porPagina = Number(sp.porPagina) || POR_PAGINA_DEFECTO;

  const [totalContratos, activosPortafolio, marcasDistintas, totalFiltrado, contratos] = await Promise.all([
    prisma.contrato.count(),
    prisma.contrato.findMany({
      where: { estado: "ACTIVO" },
      select: { moraAcumulada: true, fechaAperturaPeriodoActual: true },
    }),
    prisma.motocicleta.findMany({ distinct: ["marca"], select: { marca: true }, orderBy: { marca: "asc" } }),
    prisma.contrato.count({ where }),
    prisma.contrato.findMany({
      where,
      orderBy,
      skip: (pagina - 1) * porPagina,
      take: porPagina,
      include: {
        cliente: { select: { nombreCompleto: true } },
        motocicleta: { select: { placa: true, marca: true, modelo: true, fotoUrl: true } },
        pagos: { orderBy: { fecha: "desc" }, take: 1, select: { fecha: true } },
      },
    }),
  ]);

  const enMoraPortafolio = activosPortafolio.filter((c) => c.moraAcumulada > 0);
  const moraTotal = sumarPesos(...activosPortafolio.map((c) => c.moraAcumulada));
  const periodosAtrasados = activosPortafolio.filter(
    (c) => diasDesde(c.fechaAperturaPeriodoActual) > UMBRAL_PERIODO_ABIERTO_DIAS,
  );

  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / porPagina));

  function queryActual(): Record<string, string> {
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (estado !== "todos") params.estado = estado;
    if (marca !== "todas") params.marca = marca;
    if (fechaCreacion !== "todas") params.fechaCreacion = fechaCreacion;
    return params;
  }

  function hrefPagina(p: number): string {
    const params = new URLSearchParams(queryActual());
    if (porPagina !== POR_PAGINA_DEFECTO) params.set("porPagina", porPagina.toString());
    params.set("page", p.toString());
    return `/contratos?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Contratos" }]}
        title="Contratos"
        subtitle="Arrendamientos con opción de compra en curso."
        imageSrc="/images/moto-banner.png"
        tagline={{ linea1: "Más contratos,", linea2: "más oportunidades." }}
        actions={
          <Link href="/contratos/nuevo" className={buttonVariants()}>
            <Plus data-icon="inline-start" className="size-4" />
            Nuevo contrato
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <IconStatCard
          icon={FileText}
          label="Contratos activos"
          value={activosPortafolio.length.toString()}
          hint="del total de contratos"
        />
        <IconStatCard
          icon={AlertTriangle}
          label="En mora"
          value={enMoraPortafolio.length.toString()}
          tono={enMoraPortafolio.length > 0 ? "warning" : "success"}
          hint="requiere atención"
        />
        <IconStatCard
          icon={Wallet}
          label="Mora total de cartera"
          value={formatCOP(moraTotal)}
          tono={moraTotal > 0 ? "warning" : "success"}
          hint="saldo en mora actual"
        />
        <IconStatCard
          icon={CalendarClock}
          label="Periodos abiertos"
          value={periodosAtrasados.length.toString()}
          tono={periodosAtrasados.length > 0 ? "warning" : "success"}
          hint={`con más de ${UMBRAL_PERIODO_ABIERTO_DIAS} días`}
        />
      </div>

      <ContratosFilters
        basePath="/contratos"
        valores={{ q, estado, marca, fechaCreacion }}
        marcas={marcasDistintas.map((m) => m.marca)}
      />

      {contratos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <FileX2 className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {totalContratos === 0
                ? "Todavía no hay contratos registrados."
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
                      {formatCOP(contrato.saldoCapitalPendiente)}
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
                  <TableHead className="hidden sm:table-cell">Saldo capital</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Inicio del contrato</TableHead>
                  <TableHead className="hidden lg:table-cell">Último pago</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratos.map((contrato) => {
                  const color = colorAvatar(contrato.clienteId);
                  const estadoInfo = estadoContratoInfo(contrato);
                  const ultimoPago = contrato.pagos[0];
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
                        <div className="flex items-center gap-2.5">
                          <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                            {contrato.motocicleta.fotoUrl ? (
                              <Image
                                src={contrato.motocicleta.fotoUrl}
                                alt={contrato.motocicleta.placa}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <Bike className="size-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-foreground">
                              {contrato.motocicleta.marca} {contrato.motocicleta.modelo}
                            </p>
                            <p className="text-xs text-muted-foreground">{contrato.motocicleta.placa}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden tabular-nums sm:table-cell">
                        {formatCOP(contrato.saldoCapitalPendiente)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={estadoInfo.variant}>{estadoInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{formatFecha(contrato.fechaInicio)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {ultimoPago ? formatFecha(ultimoPago.fecha) : <span className="text-muted-foreground">Sin pagos</span>}
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
              <PorPaginaSelect basePath="/contratos" query={queryActual()} valor={porPagina} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
