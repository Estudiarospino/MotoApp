import { Prisma } from "@/generated/prisma/client";

export type ClientesSearchParams = {
  q?: string;
  estado?: string;
  contrato?: string;
  orden?: string;
  page?: string;
  porPagina?: string;
};

export function construirFiltroClientes(sp: ClientesSearchParams): {
  where: Prisma.ClienteWhereInput;
  orderBy: Prisma.ClienteOrderByWithRelationInput;
  q: string;
  estado: string;
  contrato: string;
  orden: string;
} {
  const q = sp.q?.trim() ?? "";
  const estado = sp.estado ?? "todos";
  const contrato = sp.contrato ?? "todos";
  const orden = sp.orden ?? "reciente";

  const where: Prisma.ClienteWhereInput = {
    ...(q && {
      OR: [
        { nombreCompleto: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { numeroIdentificacion: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { telefono: { contains: q, mode: Prisma.QueryMode.insensitive } },
      ],
    }),
    ...(estado === "activo" && { activo: true }),
    ...(estado === "inactivo" && { activo: false }),
    ...(contrato === "con" && { contratos: { some: { estado: "ACTIVO" } } }),
    ...(contrato === "sin" && { contratos: { none: { estado: "ACTIVO" } } }),
  };

  const orderBy: Prisma.ClienteOrderByWithRelationInput =
    orden === "nombre_asc"
      ? { nombreCompleto: "asc" }
      : orden === "nombre_desc"
        ? { nombreCompleto: "desc" }
        : orden === "antiguo"
          ? { createdAt: "asc" }
          : { createdAt: "desc" };

  return { where, orderBy, q, estado, contrato, orden };
}
