import { Prisma, type CategoriaGasto } from "@/generated/prisma/client";

export type GastosSearchParams = {
  q?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  categoria?: string;
  motocicletaId?: string;
  estado?: string;
  orden?: string;
  page?: string;
  porPagina?: string;
  nuevo?: string;
};

export function construirFiltroGastos(sp: GastosSearchParams): {
  where: Prisma.GastoWhereInput;
  orderBy: Prisma.GastoOrderByWithRelationInput;
  q: string;
  fechaDesde: string;
  fechaHasta: string;
  categoria: string;
  motocicletaId: string;
  estado: string;
  orden: string;
} {
  const q = sp.q?.trim() ?? "";
  const fechaDesde = sp.fechaDesde ?? "";
  const fechaHasta = sp.fechaHasta ?? "";
  const categoria = sp.categoria ?? "todas";
  const motocicletaId = sp.motocicletaId ?? "todas";
  const estado = sp.estado ?? "todos";
  const orden = sp.orden ?? "fecha_desc";

  const fechaFiltro: Prisma.DateTimeFilter = {};
  if (fechaDesde) fechaFiltro.gte = new Date(`${fechaDesde}T00:00:00.000Z`);
  if (fechaHasta) fechaFiltro.lte = new Date(`${fechaHasta}T23:59:59.999Z`);

  const where: Prisma.GastoWhereInput = {
    ...(q && {
      OR: [
        { descripcion: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { motocicleta: { placa: { contains: q, mode: Prisma.QueryMode.insensitive } } },
        { motocicleta: { marca: { contains: q, mode: Prisma.QueryMode.insensitive } } },
        { motocicleta: { modelo: { contains: q, mode: Prisma.QueryMode.insensitive } } },
      ],
    }),
    ...(Object.keys(fechaFiltro).length > 0 && { fecha: fechaFiltro }),
    ...(categoria !== "todas" && { categoria: categoria as CategoriaGasto }),
    ...(motocicletaId !== "todas" && { motocicletaId }),
    ...(estado === "con_comprobante" && { documentos: { some: {} } }),
    ...(estado === "sin_comprobante" && { documentos: { none: {} } }),
  };

  const orderBy: Prisma.GastoOrderByWithRelationInput =
    orden === "fecha_asc"
      ? { fecha: "asc" }
      : orden === "monto_desc"
        ? { monto: "desc" }
        : orden === "monto_asc"
          ? { monto: "asc" }
          : { fecha: "desc" };

  return { where, orderBy, q, fechaDesde, fechaHasta, categoria, motocicletaId, estado, orden };
}
