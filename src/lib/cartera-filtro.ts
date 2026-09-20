import { Prisma } from "@/generated/prisma/client";
import { UMBRAL_PERIODO_ABIERTO_DIAS } from "@/lib/contrato-estado";

export type CarteraSearchParams = {
  q?: string;
  estado?: string;
  orden?: string;
  page?: string;
  porPagina?: string;
};

export function construirFiltroCartera(sp: CarteraSearchParams): {
  where: Prisma.ContratoWhereInput;
  orderBy: Prisma.ContratoOrderByWithRelationInput;
  q: string;
  estado: string;
  orden: string;
} {
  const q = sp.q?.trim() ?? "";
  const estado = sp.estado ?? "todos";
  const orden = sp.orden ?? "mora_desc";

  const folioBuscado = /^(CT-)?0*(\d+)$/i.exec(q)?.[2];

  const umbralFecha = new Date(Date.now() - UMBRAL_PERIODO_ABIERTO_DIAS * 24 * 60 * 60 * 1000);

  const where: Prisma.ContratoWhereInput = {
    estado: "ACTIVO",
    ...(q && {
      OR: [
        ...(folioBuscado ? [{ folio: Number(folioBuscado) }] : []),
        { cliente: { nombreCompleto: { contains: q, mode: Prisma.QueryMode.insensitive } } },
        { motocicleta: { placa: { contains: q, mode: Prisma.QueryMode.insensitive } } },
        { motocicleta: { modelo: { contains: q, mode: Prisma.QueryMode.insensitive } } },
      ],
    }),
    ...(estado === "al_dia" && { moraAcumulada: 0 }),
    ...(estado === "en_mora" && { moraAcumulada: { gt: 0 } }),
    ...(estado === "atraso_critico" && {
      moraAcumulada: { gt: 0 },
      fechaAperturaPeriodoActual: { lte: umbralFecha },
    }),
  };

  const ORDEN_MAP: Record<string, Prisma.ContratoOrderByWithRelationInput> = {
    mora_desc: { moraAcumulada: "desc" },
    mora_asc: { moraAcumulada: "asc" },
    saldo_desc: { saldoCapitalPendiente: "desc" },
    saldo_asc: { saldoCapitalPendiente: "asc" },
  };
  const orderBy = ORDEN_MAP[orden] ?? ORDEN_MAP.mora_desc;

  return { where, orderBy, q, estado, orden };
}
