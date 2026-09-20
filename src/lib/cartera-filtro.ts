import { Prisma } from "@/generated/prisma/client";
import { formatFolioContrato } from "@/lib/format";
import { contratoEnAtrasoCritico } from "@/lib/contrato-estado";

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
    // "atraso_critico" NO se puede resolver en el WHERE: depende de la frecuencia de pago
    // de cada contrato combinada con la fecha de su último pago. Se filtra en memoria
    // con `filtrarAtrasoCriticoEnMemoria` sobre el universo ACTIVO (+ búsqueda) de abajo.
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

export type ContratoCarteraHidratado = {
  folio: number;
  saldoCapitalPendiente: number;
  moraAcumulada: number;
  fechaInicio: Date;
  frecuenciaPago: string;
  cliente: { nombreCompleto: string };
  motocicleta: { placa: string; modelo: string };
  pagos: { fecha: Date }[];
};

function coincideBusqueda(c: ContratoCarteraHidratado, q: string): boolean {
  if (!q) return true;
  const texto = q.toLowerCase();
  const folioBuscado = /^(CT-)?0*(\d+)$/i.exec(q)?.[2];
  if (folioBuscado && c.folio === Number(folioBuscado)) return true;
  return (
    c.cliente.nombreCompleto.toLowerCase().includes(texto) ||
    c.motocicleta.placa.toLowerCase().includes(texto) ||
    c.motocicleta.modelo.toLowerCase().includes(texto) ||
    formatFolioContrato(c.folio).toLowerCase().includes(texto)
  );
}

const COMPARADORES: Record<string, (a: ContratoCarteraHidratado, b: ContratoCarteraHidratado) => number> = {
  mora_desc: (a, b) => b.moraAcumulada - a.moraAcumulada,
  mora_asc: (a, b) => a.moraAcumulada - b.moraAcumulada,
  saldo_desc: (a, b) => b.saldoCapitalPendiente - a.saldoCapitalPendiente,
  saldo_asc: (a, b) => a.saldoCapitalPendiente - b.saldoCapitalPendiente,
};

/** Filtra (búsqueda + atraso crítico según frecuencia) y ordena en memoria, sobre el universo ACTIVO ya cargado. */
export function filtrarAtrasoCriticoEnMemoria<T extends ContratoCarteraHidratado>(
  contratos: T[],
  { q, orden }: { q: string; orden: string },
): T[] {
  return contratos
    .filter((c) => coincideBusqueda(c, q))
    .filter(
      (c) =>
        c.moraAcumulada > 0 &&
        contratoEnAtrasoCritico({
          frecuenciaPago: c.frecuenciaPago,
          fechaInicio: c.fechaInicio,
          ultimoPagoFecha: c.pagos[0]?.fecha ?? null,
        }),
    )
    .sort(COMPARADORES[orden] ?? COMPARADORES.mora_desc);
}
