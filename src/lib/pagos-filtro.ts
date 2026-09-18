import { Prisma, $Enums } from "@/generated/prisma/client";

export type PagosSearchParams = {
  q?: string;
  tipo?: string;
  metodoPagoId?: string;
  estado?: string;
  fecha?: string;
  page?: string;
  porPagina?: string;
};

function inicioDeMes(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), 1));
}

function inicioDeAnio(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), 0, 1));
}

export function construirFiltroPagos(sp: PagosSearchParams): {
  where: Prisma.PagoWhereInput;
  orderBy: Prisma.PagoOrderByWithRelationInput;
  q: string;
  tipo: string;
  metodoPagoId: string;
  estado: string;
  fecha: string;
} {
  const q = sp.q?.trim() ?? "";
  const tipo = sp.tipo ?? "todos";
  const metodoPagoId = sp.metodoPagoId ?? "todos";
  const estado = sp.estado ?? "todos";
  const fecha = sp.fecha ?? "todas";

  const folioBuscado = /^(CT-)?0*(\d+)$/i.exec(q)?.[2];

  const ahora = new Date();
  const esteMes = inicioDeMes(ahora);
  const mesAnterior = new Date(Date.UTC(esteMes.getUTCFullYear(), esteMes.getUTCMonth() - 1, 1));
  const esteAnio = inicioDeAnio(ahora);

  const where: Prisma.PagoWhereInput = {
    ...(q && {
      OR: [
        ...(folioBuscado ? [{ contrato: { folio: Number(folioBuscado) } }] : []),
        { contrato: { cliente: { nombreCompleto: { contains: q, mode: Prisma.QueryMode.insensitive } } } },
        { referencia: { contains: q, mode: Prisma.QueryMode.insensitive } },
      ],
    }),
    ...(tipo !== "todos" && { tipo: tipo as $Enums.TipoPago }),
    ...(metodoPagoId !== "todos" && { metodoPagoId }),
    ...(estado === "con_recibo" && { periodoCierreId: { not: null } }),
    ...(estado === "periodo_abierto" && {
      periodoCierreId: null,
      // los abonos a capital nunca están "en periodo abierto"; solo forzamos ARRIENDO si el usuario no eligió tipo
      tipo: tipo !== "todos" ? (tipo as $Enums.TipoPago) : "ARRIENDO",
    }),
    ...(fecha === "este_mes" && { fecha: { gte: esteMes } }),
    ...(fecha === "mes_anterior" && { fecha: { gte: mesAnterior, lt: esteMes } }),
    ...(fecha === "este_anio" && { fecha: { gte: esteAnio } }),
  };

  const orderBy: Prisma.PagoOrderByWithRelationInput = { fecha: "desc" };

  return { where, orderBy, q, tipo, metodoPagoId, estado, fecha };
}
