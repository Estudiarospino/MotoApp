import { Prisma } from "@/generated/prisma/client";

export type MotosSearchParams = {
  q?: string;
  estado?: string;
  marca?: string;
  orden?: string;
  page?: string;
  porPagina?: string;
  nuevo?: string;
};

export function construirFiltroMotos(sp: MotosSearchParams): {
  where: Prisma.MotocicletaWhereInput;
  orderBy: Prisma.MotocicletaOrderByWithRelationInput;
  q: string;
  estado: string;
  marca: string;
  orden: string;
} {
  const q = sp.q?.trim() ?? "";
  const estado = sp.estado ?? "todos";
  const marca = sp.marca ?? "todas";
  const orden = sp.orden ?? "reciente";

  const where: Prisma.MotocicletaWhereInput = {
    ...(q && {
      OR: [
        { placa: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { marca: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { modelo: { contains: q, mode: Prisma.QueryMode.insensitive } },
      ],
    }),
    ...(estado === "disponible" && { estado: "DISPONIBLE" }),
    ...(estado === "en_contrato" && { estado: "EN_CONTRATO" }),
    ...(estado === "vendida" && { estado: "VENDIDA" }),
    ...(marca !== "todas" && { marca }),
  };

  const orderBy: Prisma.MotocicletaOrderByWithRelationInput =
    orden === "precio_asc"
      ? { precioInicial: "asc" }
      : orden === "precio_desc"
        ? { precioInicial: "desc" }
        : orden === "marca_asc"
          ? { marca: "asc" }
          : orden === "antiguo"
            ? { createdAt: "asc" }
            : { createdAt: "desc" };

  return { where, orderBy, q, estado, marca, orden };
}
