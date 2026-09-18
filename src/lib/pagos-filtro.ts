import { Prisma, $Enums } from "@/generated/prisma/client";

export type PagosSearchParams = {
  q?: string;
  metodo?: string;
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
  metodo: string;
  estado: string;
  fecha: string;
} {
  const q = sp.q?.trim() ?? "";
  const metodo = sp.metodo ?? "todos";
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
    ...(metodo !== "todos" && { metodo: metodo as $Enums.MetodoPago }),
    ...(estado === "con_recibo" && { periodoCierreId: { not: null } }),
    ...(estado === "periodo_abierto" && { periodoCierreId: null }),
    ...(fecha === "este_mes" && { fecha: { gte: esteMes } }),
    ...(fecha === "mes_anterior" && { fecha: { gte: mesAnterior, lt: esteMes } }),
    ...(fecha === "este_anio" && { fecha: { gte: esteAnio } }),
  };

  const orderBy: Prisma.PagoOrderByWithRelationInput = { fecha: "desc" };

  return { where, orderBy, q, metodo, estado, fecha };
}
