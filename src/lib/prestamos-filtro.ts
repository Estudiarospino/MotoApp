import { Prisma } from "@/generated/prisma/client";

export type PrestamosSearchParams = {
  q?: string;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  orden?: string;
  page?: string;
  porPagina?: string;
  nuevo?: string;
};

export function construirFiltroPrestamos(sp: PrestamosSearchParams): {
  where: Prisma.PrestamoWhereInput;
  orderBy: Prisma.PrestamoOrderByWithRelationInput;
  q: string;
  estado: string;
  fechaDesde: string;
  fechaHasta: string;
  orden: string;
} {
  const q = sp.q?.trim() ?? "";
  const estado = sp.estado ?? "todos";
  const fechaDesde = sp.fechaDesde ?? "";
  const fechaHasta = sp.fechaHasta ?? "";
  const orden = sp.orden ?? "fecha_desc";

  const fechaFiltro: Prisma.DateTimeFilter = {};
  if (fechaDesde) fechaFiltro.gte = new Date(`${fechaDesde}T00:00:00.000Z`);
  if (fechaHasta) fechaFiltro.lte = new Date(`${fechaHasta}T23:59:59.999Z`);

  const where: Prisma.PrestamoWhereInput = {
    ...(q && {
      cliente: { nombreCompleto: { contains: q, mode: Prisma.QueryMode.insensitive } },
    }),
    ...(estado === "activo" && { estado: "ACTIVO" }),
    ...(estado === "pagado" && { estado: "PAGADO" }),
    ...(Object.keys(fechaFiltro).length > 0 && { fecha: fechaFiltro }),
  };

  const orderBy: Prisma.PrestamoOrderByWithRelationInput = orden === "fecha_asc" ? { fecha: "asc" } : { fecha: "desc" };

  return { where, orderBy, q, estado, fechaDesde, fechaHasta, orden };
}
