import Link from "next/link";
import { cn } from "cn";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  MessageCircle,
  Pencil,
  Users,
  UserX,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCOP } from "@/lib/money";
import { formatFecha } from "@/lib/format";
import { colorAvatar, iniciales } from "@/lib/avatar";
import { construirFiltroClientes, type ClientesSearchParams } from "@/lib/clientes-filtro";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { IconStatCard } from "@/components/icon-stat-card";
import { PageHeader } from "@/components/page-header";
import { ClientesFilters } from "@/components/clientes/clientes-filters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toggleActivoCliente } from "./actions";
import { ClienteDialog } from "./cliente-dialog";

const POR_PAGINA_DEFECTO = 10;

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<ClientesSearchParams>;
}) {
  const sp = await searchParams;
  const { where, orderBy, q, estado, contrato, orden } = construirFiltroClientes(sp);
  const pagina = Math.max(1, Number(sp.page) || 1);
  const porPagina = Number(sp.porPagina) || POR_PAGINA_DEFECTO;

  const [totalClientes, clientesActivos, clientesConContratoActivo, totalFiltrado, clientes] = await Promise.all([
    prisma.cliente.count(),
    prisma.cliente.count({ where: { activo: true } }),
    prisma.cliente.count({ where: { contratos: { some: { estado: "ACTIVO" } } } }),
    prisma.cliente.count({ where }),
    prisma.cliente.findMany({
      where,
      orderBy,
      skip: (pagina - 1) * porPagina,
      take: porPagina,
      include: {
        contratos: {
          select: {
            estado: true,
            pagos: { orderBy: { fecha: "desc" }, take: 1, select: { fecha: true, monto: true } },
          },
        },
      },
    }),
  ]);

  const clientesInactivos = totalClientes - clientesActivos;
  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / porPagina));

  function hrefPagina(p: number): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (estado !== "todos") params.set("estado", estado);
    if (contrato !== "todos") params.set("contrato", contrato);
    if (orden !== "reciente") params.set("orden", orden);
    if (porPagina !== POR_PAGINA_DEFECTO) params.set("porPagina", porPagina.toString());
    params.set("page", p.toString());
    return `/clientes?${params.toString()}`;
  }

  const exportHref = `/api/clientes/export?${new URLSearchParams({
    ...(q && { q }),
    ...(estado !== "todos" && { estado }),
    ...(contrato !== "todos" && { contrato }),
  }).toString()}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Clientes" }]}
        title="Clientes"
        subtitle="Gestiona la base de clientes de tu negocio."
        icon={Users}
        tagline={{ linea1: "Clientes que confían,", linea2: "negocios que avanzan." }}
        actions={
          <>
            <a href={exportHref} className={cn(buttonVariants({ variant: "outline" }), "hidden sm:inline-flex")}>
              <Download data-icon="inline-start" className="size-4" />
              Exportar
            </a>
            <ClienteDialog defaultOpen={sp.nuevo === "1"} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <IconStatCard icon={Users} label="Total de clientes" value={totalClientes.toString()} hint="en la base de datos" />
        <IconStatCard
          icon={CheckCircle2}
          label="Clientes activos"
          value={clientesActivos.toString()}
          tono="success"
          hint={`${totalClientes === 0 ? 0 : Math.round((clientesActivos / totalClientes) * 100)}% del total`}
        />
        <IconStatCard
          icon={Clock}
          label="Con contratos activos"
          value={clientesConContratoActivo.toString()}
          tono="warning"
          hint="tienen una moto en arriendo"
        />
        <IconStatCard
          icon={UserX}
          label="Clientes inactivos"
          value={clientesInactivos.toString()}
          hint="sin actividad reciente"
        />
      </div>

      <ClientesFilters basePath="/clientes" valores={{ q, estado, contrato, orden }} />

      {clientes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Users className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {totalClientes === 0 ? "Todavía no hay clientes registrados." : "Ningún cliente coincide con los filtros."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Móvil: lista de tarjetas táctiles */}
          <div className="flex flex-col gap-1 sm:hidden">
            {clientes.map((cliente) => {
              const color = colorAvatar(cliente.id);
              const contratosActivos = cliente.contratos.filter((c) => c.estado === "ACTIVO").length;
              return (
                <Link
                  key={cliente.id}
                  href={`/clientes/${cliente.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3"
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${color.bg} ${color.text}`}
                  >
                    {iniciales(cliente.nombreCompleto)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{cliente.nombreCompleto}</p>
                    <p className="text-xs text-muted-foreground">
                      {cliente.tipoIdentificacion} {cliente.numeroIdentificacion}
                    </p>
                    {cliente.telefono && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageCircle className="size-3 text-success" />
                        {cliente.telefono}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={cliente.activo ? "success" : "secondary"}>
                      {cliente.activo ? "Activo" : "Inactivo"}
                    </Badge>
                    {contratosActivos > 0 && (
                      <span className="text-xs font-medium text-primary">{contratosActivos} activo{contratosActivos === 1 ? "" : "s"}</span>
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
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Identificación</TableHead>
                  <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                  <TableHead>Contratos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Último pago</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((cliente, i) => {
                  const color = colorAvatar(cliente.id);
                  const contratosActivos = cliente.contratos.filter((c) => c.estado === "ACTIVO").length;
                  const ultimoPago = cliente.contratos
                    .flatMap((c) => c.pagos)
                    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())[0];
                  const toggleConId = toggleActivoCliente.bind(null, cliente.id);

                  return (
                    <TableRow key={cliente.id}>
                      <TableCell className="text-muted-foreground">{(pagina - 1) * porPagina + i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${color.bg} ${color.text}`}
                          >
                            {iniciales(cliente.nombreCompleto)}
                          </span>
                          <span className="font-medium text-foreground">{cliente.nombreCompleto}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {cliente.tipoIdentificacion} {cliente.numeroIdentificacion}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {cliente.telefono ? (
                          <a
                            href={`https://wa.me/57${cliente.telefono.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-foreground hover:text-success"
                          >
                            <MessageCircle className="size-4 text-success" />
                            {cliente.telefono}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contratosActivos > 0 ? (
                          <Link href="/contratos" className="font-medium text-primary hover:underline">
                            {contratosActivos} activo{contratosActivos === 1 ? "" : "s"}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cliente.activo ? "success" : "secondary"}>
                          {cliente.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {ultimoPago ? (
                          <div>
                            <p className="text-foreground">{formatFecha(ultimoPago.fecha)}</p>
                            <p className="text-xs text-muted-foreground">{formatCOP(ultimoPago.monto)}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-muted-foreground">Sin pagos</p>
                            <p className="text-xs text-muted-foreground">—</p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/clientes/${cliente.id}`}
                            aria-label="Ver cliente"
                            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
                          >
                            <Eye className="size-4" />
                          </Link>
                          <Link
                            href={`/clientes/${cliente.id}/editar`}
                            aria-label="Editar cliente"
                            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
                          >
                            <Pencil className="size-4" />
                          </Link>
                          <form action={toggleConId}>
                            <button
                              type="submit"
                              className={buttonVariants({ variant: "ghost", size: "sm" })}
                            >
                              {cliente.activo ? "Desactivar" : "Activar"}
                            </button>
                          </form>
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
              cliente{totalFiltrado === 1 ? "" : "s"}
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
