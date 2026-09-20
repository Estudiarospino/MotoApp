import "server-only";
import { prisma } from "@/lib/db";
import { sumarPesos, type Pesos } from "@/lib/money";

const MS_DIA = 24 * 60 * 60 * 1000;

export function inicioDeDia(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}

/** Lunes de la semana que contiene `fecha` (semana de negocio: lunes a domingo). */
export function inicioDeSemana(fecha: Date): Date {
  const dia = inicioDeDia(fecha);
  const diaSemana = dia.getUTCDay(); // 0 = domingo
  const offset = diaSemana === 0 ? 6 : diaSemana - 1;
  return new Date(dia.getTime() - offset * MS_DIA);
}

export function inicioDeMes(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), 1));
}

export function inicioDeAnio(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), 0, 1));
}

export function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getTime() + dias * MS_DIA);
}

export function sumarMeses(fecha: Date, cantidad: number): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth() + cantidad, fecha.getUTCDate()));
}

export function sumarAnios(fecha: Date, cantidad: number): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear() + cantidad, fecha.getUTCMonth(), fecha.getUTCDate()));
}

export function claveDia(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/** Rango [desde, hasta) que cubre la grilla del mes (semanas completas, lunes a domingo). */
export function rangoMes(fecha: Date): { desde: Date; hasta: Date } {
  const inicioMes = inicioDeMes(fecha);
  const finMesExclusivo = sumarMeses(inicioMes, 1);
  const desde = inicioDeSemana(inicioMes);
  const hasta = sumarDias(inicioDeSemana(sumarDias(finMesExclusivo, -1)), 7);
  return { desde, hasta };
}

/** Rango [desde, hasta) de la semana (lunes a domingo) que contiene `fecha`. */
export function rangoSemana(fecha: Date): { desde: Date; hasta: Date } {
  const desde = inicioDeSemana(fecha);
  return { desde, hasta: sumarDias(desde, 7) };
}

export type PagoCalendario = {
  id: string;
  fecha: Date;
  monto: Pesos;
  tipo: "ARRIENDO" | "ABONO_CAPITAL";
  folio: number;
  clienteId: string;
  clienteNombre: string;
  metodoNombre: string;
};

/** Trae los pagos entre `desde` (inclusive) y `hasta` (exclusivo), agrupados por día (clave YYYY-MM-DD). */
export async function getPagosDelRango(desde: Date, hasta: Date): Promise<Map<string, PagoCalendario[]>> {
  const pagos = await prisma.pago.findMany({
    where: { fecha: { gte: desde, lt: hasta } },
    orderBy: { fecha: "asc" },
    include: {
      contrato: { select: { folio: true, cliente: { select: { id: true, nombreCompleto: true } } } },
      metodoPago: { select: { nombre: true } },
    },
  });

  const porDia = new Map<string, PagoCalendario[]>();
  for (const pago of pagos) {
    const clave = claveDia(pago.fecha);
    const lista = porDia.get(clave) ?? [];
    lista.push({
      id: pago.id,
      fecha: pago.fecha,
      monto: pago.monto,
      tipo: pago.tipo,
      folio: pago.contrato.folio,
      clienteId: pago.contrato.cliente.id,
      clienteNombre: pago.contrato.cliente.nombreCompleto,
      metodoNombre: pago.metodoPago.nombre,
    });
    porDia.set(clave, lista);
  }
  return porDia;
}

export type MesResumen = { mes: number; total: Pesos; cantidad: number };

/** Total y conteo de pagos por mes (0-11) del año dado, agregados en JS igual que `getResumenFinanciero`. */
export async function getResumenAnual(anio: number): Promise<MesResumen[]> {
  const desde = new Date(Date.UTC(anio, 0, 1));
  const hasta = new Date(Date.UTC(anio + 1, 0, 1));

  const pagos = await prisma.pago.findMany({
    where: { fecha: { gte: desde, lt: hasta } },
    select: { fecha: true, monto: true },
  });

  const meses: MesResumen[] = Array.from({ length: 12 }, (_, mes) => ({ mes, total: 0, cantidad: 0 }));
  for (const pago of pagos) {
    const resumen = meses[pago.fecha.getUTCMonth()];
    resumen.total = sumarPesos(resumen.total, pago.monto);
    resumen.cantidad += 1;
  }
  return meses;
}
