import { Prisma } from "@/generated/prisma/client";

export type ContratosSearchParams = {
  q?: string;
  estado?: string;
  marca?: string;
  fechaCreacion?: string;
  page?: string;
  porPagina?: string;
  nuevo?: string;
  clienteId?: string;
  renegociarDe?: string;
};

function inicioDeMes(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), 1));
}

function inicioDeAnio(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), 0, 1));
}

export function construirFiltroContratos(sp: ContratosSearchParams): {
  where: Prisma.ContratoWhereInput;
  orderBy: Prisma.ContratoOrderByWithRelationInput;
  q: string;
  estado: string;
  marca: string;
  fechaCreacion: string;
} {
  const q = sp.q?.trim() ?? "";
  const estado = sp.estado ?? "todos";
  const marca = sp.marca ?? "todas";
  const fechaCreacion = sp.fechaCreacion ?? "todas";

  const folioBuscado = /^(CT-)?0*(\d+)$/i.exec(q)?.[2];

  const ahora = new Date();
  const esteMes = inicioDeMes(ahora);
  const mesAnterior = new Date(Date.UTC(esteMes.getUTCFullYear(), esteMes.getUTCMonth() - 1, 1));
  const esteAnio = inicioDeAnio(ahora);

  const where: Prisma.ContratoWhereInput = {
    ...(q && {
      OR: [
        ...(folioBuscado ? [{ folio: Number(folioBuscado) }] : []),
        { cliente: { nombreCompleto: { contains: q, mode: Prisma.QueryMode.insensitive } } },
        { motocicleta: { placa: { contains: q, mode: Prisma.QueryMode.insensitive } } },
        { motocicleta: { modelo: { contains: q, mode: Prisma.QueryMode.insensitive } } },
      ],
    }),
    ...(estado === "al_dia" && { estado: "ACTIVO", moraAcumulada: 0 }),
    ...(estado === "en_mora" && { estado: "ACTIVO", moraAcumulada: { gt: 0 } }),
    ...(estado === "incumplido" && { estado: "INCUMPLIDO_RECUPERADA" }),
    ...(estado === "finalizado" && { estado: { in: ["FINALIZADO_PAGADO", "FINALIZADO_COMPRADO"] } }),
    ...(marca !== "todas" && { motocicleta: { marca } }),
    ...(fechaCreacion === "este_mes" && { createdAt: { gte: esteMes } }),
    ...(fechaCreacion === "mes_anterior" && { createdAt: { gte: mesAnterior, lt: esteMes } }),
    ...(fechaCreacion === "este_anio" && { createdAt: { gte: esteAnio } }),
  };

  const orderBy: Prisma.ContratoOrderByWithRelationInput = { folio: "desc" };

  return { where, orderBy, q, estado, marca, fechaCreacion };
}
