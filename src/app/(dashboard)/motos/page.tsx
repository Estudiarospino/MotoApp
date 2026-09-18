import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  Bike,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Pencil,
  Plus,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCOP } from "@/lib/money";
import { formatFolioContrato } from "@/lib/format";
import { construirFiltroMotos, type MotosSearchParams } from "@/lib/motos-filtro";
import { motoNecesitaAtencionDocumentos } from "@/lib/moto-documentos";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { IconStatCard } from "@/components/icon-stat-card";
import { PageHeader } from "@/components/page-header";
import { MotosFilters } from "@/components/motos/motos-filters";
import { MotoMoreMenu } from "@/components/motos/moto-more-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ESTADO_BADGE = {
  DISPONIBLE: "success",
  EN_CONTRATO: "default",
  VENDIDA: "secondary",
} as const;

const ESTADO_LABEL = {
  DISPONIBLE: "Disponible",
  EN_CONTRATO: "En contrato",
  VENDIDA: "Vendida",
} as const;

const POR_PAGINA_DEFECTO = 10;

export default async function MotosPage({
  searchParams,
}: {
  searchParams: Promise<MotosSearchParams>;
}) {
  const sp = await searchParams;
  const { where, orderBy, q, estado, marca, orden } = construirFiltroMotos(sp);
  const pagina = Math.max(1, Number(sp.page) || 1);
  const porPagina = Number(sp.porPagina) || POR_PAGINA_DEFECTO;

  const [totalMotos, disponibles, enContrato, vendidas, marcasDistintas, totalFiltrado, motos] = await Promise.all([
    prisma.motocicleta.count(),
    prisma.motocicleta.count({ where: { estado: "DISPONIBLE" } }),
    prisma.motocicleta.count({ where: { estado: "EN_CONTRATO" } }),
    prisma.motocicleta.count({ where: { estado: "VENDIDA" } }),
    prisma.motocicleta.findMany({ distinct: ["marca"], select: { marca: true }, orderBy: { marca: "asc" } }),
    prisma.motocicleta.count({ where }),
    prisma.motocicleta.findMany({
      where,
      orderBy,
      skip: (pagina - 1) * porPagina,
      take: porPagina,
      include: {
        contratos: {
          where: { estado: "ACTIVO" },
          take: 1,
          select: {
            id: true,
            folio: true,
            cliente: { select: { nombreCompleto: true, numeroIdentificacion: true } },
          },
        },
      },
    }),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / porPagina));

  function hrefPagina(p: number): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (estado !== "todos") params.set("estado", estado);
    if (marca !== "todas") params.set("marca", marca);
    if (orden !== "reciente") params.set("orden", orden);
    if (porPagina !== POR_PAGINA_DEFECTO) params.set("porPagina", porPagina.toString());
    params.set("page", p.toString());
    return `/motos?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Motocicletas" }]}
        title="Motocicletas"
        subtitle="Inventario de la flota de tu negocio."
        imageSrc="/images/moto-banner.png"
        tagline={{ linea1: "Cada moto", linea2: "es una oportunidad" }}
        actions={
          <Link href="/motos/nueva" className={buttonVariants()}>
            <Plus data-icon="inline-start" className="size-4" />
            Nueva moto
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <IconStatCard icon={Bike} label="Total de la flota" value={totalMotos.toString()} hint="motocicletas registradas" />
        <IconStatCard
          icon={CheckCircle2}
          label="Disponibles"
          value={disponibles.toString()}
          tono="success"
          hint={`${totalMotos === 0 ? 0 : Math.round((disponibles / totalMotos) * 100)}% del total`}
        />
        <IconStatCard
          icon={FileText}
          label="En contrato"
          value={enContrato.toString()}
          hint={`${totalMotos === 0 ? 0 : Math.round((enContrato / totalMotos) * 100)}% del total`}
        />
        <IconStatCard
          icon={Archive}
          label="Vendidas"
          value={vendidas.toString()}
          hint={`${totalMotos === 0 ? 0 : Math.round((vendidas / totalMotos) * 100)}% del total`}
        />
      </div>

      <MotosFilters
        basePath="/motos"
        valores={{ q, estado, marca, orden }}
        marcas={marcasDistintas.map((m) => m.marca)}
      />

      {motos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Bike className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {totalMotos === 0 ? "Todavía no hay motos registradas." : "Ninguna moto coincide con los filtros."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Móvil: lista de tarjetas táctiles */}
          <div className="flex flex-col gap-1 sm:hidden">
            {motos.map((moto) => {
              const contratoActivo = moto.contratos[0];
              const alertaDocumentos = motoNecesitaAtencionDocumentos(moto);
              return (
                <Link
                  key={moto.id}
                  href={`/motos/${moto.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3"
                >
                  <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                    {moto.fotoUrl ? (
                      <Image src={moto.fotoUrl} alt={moto.placa} fill className="object-cover" />
                    ) : (
                      <Bike className="size-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate font-medium text-foreground">
                      {moto.placa}
                      {alertaDocumentos && (
                        <AlertTriangle
                          className="size-3.5 shrink-0 text-warning"
                          aria-label="SOAT o tecnomecánica vencidos o por vencer"
                        />
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {moto.marca} {moto.modelo}
                    </p>
                    <p className="text-xs tabular-nums text-muted-foreground">{formatCOP(moto.precioInicial)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={ESTADO_BADGE[moto.estado]}>{ESTADO_LABEL[moto.estado]}</Badge>
                    {contratoActivo && (
                      <span className="text-xs text-muted-foreground">{contratoActivo.cliente.nombreCompleto}</span>
                    )}
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
                  <TableHead>#</TableHead>
                  <TableHead>Foto</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Marca / Modelo</TableHead>
                  <TableHead className="hidden md:table-cell">Precio inicial</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Cliente actual</TableHead>
                  <TableHead className="hidden lg:table-cell">Contratos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {motos.map((moto, i) => {
                  const contratoActivo = moto.contratos[0];
                  const alertaDocumentos = motoNecesitaAtencionDocumentos(moto);
                  return (
                    <TableRow key={moto.id}>
                      <TableCell className="text-muted-foreground">{(pagina - 1) * porPagina + i + 1}</TableCell>
                      <TableCell>
                        <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                          {moto.fotoUrl ? (
                            <Image src={moto.fotoUrl} alt={moto.placa} fill className="object-cover" />
                          ) : (
                            <Bike className="size-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-1.5">
                          {moto.placa}
                          {alertaDocumentos && (
                            <AlertTriangle
                              className="size-3.5 shrink-0 text-warning"
                              aria-label="SOAT o tecnomecánica vencidos o por vencer"
                            />
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="text-foreground">
                          {moto.marca} {moto.modelo}
                        </p>
                        <p className="text-xs text-muted-foreground">{moto.marca}</p>
                      </TableCell>
                      <TableCell className="hidden tabular-nums md:table-cell">{formatCOP(moto.precioInicial)}</TableCell>
                      <TableCell>
                        <Badge variant={ESTADO_BADGE[moto.estado]}>{ESTADO_LABEL[moto.estado]}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {contratoActivo ? (
                          <div>
                            <p className="text-foreground">{contratoActivo.cliente.nombreCompleto}</p>
                            <p className="text-xs text-muted-foreground">CC {contratoActivo.cliente.numeroIdentificacion}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-muted-foreground">—</p>
                            <p className="text-xs text-muted-foreground">Sin asignar</p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {contratoActivo ? (
                          <Link href={`/contratos/${contratoActivo.id}`} className="font-medium text-primary hover:underline">
                            {formatFolioContrato(contratoActivo.folio)}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/motos/${moto.id}`}
                            aria-label="Ver moto"
                            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
                          >
                            <Eye className="size-4" />
                          </Link>
                          <Link
                            href={`/motos/${moto.id}`}
                            aria-label="Editar moto"
                            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
                          >
                            <Pencil className="size-4" />
                          </Link>
                          <MotoMoreMenu motoId={moto.id} puedeEliminar={moto.estado === "DISPONIBLE"} />
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
              Mostrando {(pagina - 1) * porPagina + 1} a {Math.min(pagina * porPagina, totalFiltrado)} de {totalFiltrado}{" "}
              motocicleta{totalFiltrado === 1 ? "" : "s"}
            </p>
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
          </div>
        </>
      )}
    </div>
  );
}
