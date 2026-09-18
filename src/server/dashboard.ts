import "server-only";
import { prisma } from "@/lib/db";
import { minPesos, restarPesos, sumarPesos, type Pesos } from "@/lib/money";

const MESES_CORTOS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const MESES_A_CARGAR = 12;

function inicioDeMes(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), 1));
}

function restarMeses(fecha: Date, cantidad: number): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth() - cantidad, 1));
}

function claveMes(fecha: Date): string {
  return `${fecha.getUTCFullYear()}-${fecha.getUTCMonth()}`;
}

export type MesFinanciero = {
  clave: string;
  mes: string;
  ingresosTotales: number;
  arriendoOperacion: number;
  abonoCapital: number;
  moras: number;
};

export type DistribucionPagos = {
  arriendoOperacion: number;
  abonoCapital: number;
  moras: number;
  total: number;
};

/** Serie mensual (últimos `MESES_A_CARGAR` meses) desagregando cada cierre de periodo en arriendo de operación / mora cobrada / abono a capital. */
export async function getResumenFinanciero(): Promise<MesFinanciero[]> {
  const ahora = new Date();
  const desde = restarMeses(inicioDeMes(ahora), MESES_A_CARGAR - 1);

  const periodos = await prisma.periodoCierre.findMany({
    where: { fechaCierre: { gte: desde } },
    select: { fechaCierre: true, arriendoCubierto: true, abonoCapital: true, moraAnterior: true },
  });

  const meses: MesFinanciero[] = [];
  for (let i = MESES_A_CARGAR - 1; i >= 0; i--) {
    const fechaMes = restarMeses(inicioDeMes(ahora), i);
    meses.push({
      clave: claveMes(fechaMes),
      mes: MESES_CORTOS[fechaMes.getUTCMonth()],
      ingresosTotales: 0,
      arriendoOperacion: 0,
      abonoCapital: 0,
      moras: 0,
    });
  }
  const porClave = new Map(meses.map((m) => [m.clave, m]));

  for (const periodo of periodos) {
    const mes = porClave.get(claveMes(periodo.fechaCierre));
    if (!mes) continue;

    const moraCobrada = minPesos(periodo.arriendoCubierto, periodo.moraAnterior);
    const arriendoOperacion = restarPesos(periodo.arriendoCubierto, moraCobrada);

    mes.arriendoOperacion = sumarPesos(mes.arriendoOperacion, arriendoOperacion);
    mes.moras = sumarPesos(mes.moras, moraCobrada);
    mes.abonoCapital = sumarPesos(mes.abonoCapital, periodo.abonoCapital);
    mes.ingresosTotales = sumarPesos(mes.arriendoOperacion, mes.moras, mes.abonoCapital);
  }

  return meses;
}

export function distribucionDesdeMeses(meses: MesFinanciero[], ultimosN: number): DistribucionPagos {
  const ventana = meses.slice(-ultimosN);
  const arriendoOperacion = sumarPesos(...ventana.map((m) => m.arriendoOperacion));
  const abonoCapital = sumarPesos(...ventana.map((m) => m.abonoCapital));
  const moras = sumarPesos(...ventana.map((m) => m.moras));
  return {
    arriendoOperacion,
    abonoCapital,
    moras,
    total: sumarPesos(arriendoOperacion, abonoCapital, moras),
  };
}

export type TendenciaMensual = { actual: number; anterior: number; variacionPct: number | null };

function calcularVariacion(actual: number, anterior: number): number | null {
  if (anterior <= 0) return null;
  return Math.round(((actual - anterior) / anterior) * 100);
}

/** Contratos nuevos (por fecha de creación) este mes vs el mes anterior. */
export async function getTendenciaContratosNuevos(): Promise<TendenciaMensual> {
  const ahora = new Date();
  const inicioMesActual = inicioDeMes(ahora);
  const inicioMesAnterior = restarMeses(inicioMesActual, 1);

  const [actual, anterior] = await Promise.all([
    prisma.contrato.count({ where: { createdAt: { gte: inicioMesActual } } }),
    prisma.contrato.count({ where: { createdAt: { gte: inicioMesAnterior, lt: inicioMesActual } } }),
  ]);

  return { actual, anterior, variacionPct: calcularVariacion(actual, anterior) };
}

/** Mora generada (según los cierres de periodo) este mes vs el mes anterior. */
export async function getTendenciaMoraGenerada(): Promise<TendenciaMensual> {
  const ahora = new Date();
  const inicioMesActual = inicioDeMes(ahora);
  const inicioMesAnterior = restarMeses(inicioMesActual, 1);

  const [periodosMesActual, periodosMesAnterior] = await Promise.all([
    prisma.periodoCierre.findMany({
      where: { fechaCierre: { gte: inicioMesActual } },
      select: { moraNueva: true },
    }),
    prisma.periodoCierre.findMany({
      where: { fechaCierre: { gte: inicioMesAnterior, lt: inicioMesActual } },
      select: { moraNueva: true },
    }),
  ]);

  const actual = sumarPesos(...periodosMesActual.map((p) => p.moraNueva));
  const anterior = sumarPesos(...periodosMesAnterior.map((p) => p.moraNueva));

  return { actual, anterior, variacionPct: calcularVariacion(actual, anterior) };
}

export type EstadoFlotaItem = { estado: "DISPONIBLE" | "EN_CONTRATO" | "VENDIDA"; cantidad: number };

export async function getEstadoFlota(): Promise<EstadoFlotaItem[]> {
  const grupos = await prisma.motocicleta.groupBy({ by: ["estado"], _count: { _all: true } });
  const orden = ["DISPONIBLE", "EN_CONTRATO", "VENDIDA"] as const;
  return orden.map((estado) => ({
    estado,
    cantidad: grupos.find((g) => g.estado === estado)?._count._all ?? 0,
  }));
}

export type GastoPorCategoria = { categoria: string; cantidad: number; total: Pesos };

export async function getGastosDelMes(): Promise<{ items: GastoPorCategoria[]; total: Pesos }> {
  const inicioMesActual = inicioDeMes(new Date());
  const grupos = await prisma.gasto.groupBy({
    by: ["categoria"],
    where: { fecha: { gte: inicioMesActual } },
    _count: { _all: true },
    _sum: { monto: true },
  });

  const items = grupos
    .map((g) => ({ categoria: g.categoria, cantidad: g._count._all, total: g._sum.monto ?? 0 }))
    .sort((a, b) => b.total - a.total);

  return { items, total: sumarPesos(...items.map((i) => i.total)) };
}

export type PrestamoActivo = {
  id: string;
  cliente: string;
  montoOriginal: Pesos;
  saldoPendiente: Pesos;
  estado: "ACTIVO" | "PAGADO";
};

export async function getPrestamosActivos(): Promise<{ items: PrestamoActivo[]; totalPendiente: Pesos }> {
  const prestamos = await prisma.prestamo.findMany({
    where: { estado: "ACTIVO" },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { cliente: { select: { nombreCompleto: true } } },
  });

  const items = prestamos.map((p) => ({
    id: p.id,
    cliente: p.cliente.nombreCompleto,
    montoOriginal: p.montoOriginal,
    saldoPendiente: p.saldoPendiente,
    estado: p.estado,
  }));

  return { items, totalPendiente: sumarPesos(...items.map((i) => i.saldoPendiente)) };
}

export type Movimiento = {
  id: string;
  tipo: "gasto" | "pago" | "contrato" | "prestamo";
  titulo: string;
  detalle: string;
  monto: Pesos;
  fecha: Date;
};

export async function getUltimosMovimientos(): Promise<Movimiento[]> {
  const [gastos, pagos, contratos, prestamos] = await Promise.all([
    prisma.gasto.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { motocicleta: { select: { placa: true } } },
    }),
    prisma.pago.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { contrato: { include: { cliente: { select: { nombreCompleto: true } } } } },
    }),
    prisma.contrato.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        cliente: { select: { nombreCompleto: true } },
        motocicleta: { select: { placa: true } },
      },
    }),
    prisma.prestamo.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { cliente: { select: { nombreCompleto: true } } },
    }),
  ]);

  const movimientos: Movimiento[] = [
    ...gastos.map((g) => ({
      id: `gasto-${g.id}`,
      tipo: "gasto" as const,
      titulo: "Gasto registrado",
      detalle: `${g.descripcion} — ${g.motocicleta.placa}`,
      monto: g.monto,
      fecha: g.createdAt,
    })),
    ...pagos.map((p) => ({
      id: `pago-${p.id}`,
      tipo: "pago" as const,
      titulo: "Pago recibido",
      detalle: p.contrato.cliente.nombreCompleto,
      monto: p.monto,
      fecha: p.createdAt,
    })),
    ...contratos.map((c) => ({
      id: `contrato-${c.id}`,
      tipo: "contrato" as const,
      titulo: "Nuevo contrato",
      detalle: `${c.cliente.nombreCompleto} — ${c.motocicleta.placa}`,
      monto: c.valorTotalContrato,
      fecha: c.createdAt,
    })),
    ...prestamos.map((p) => ({
      id: `prestamo-${p.id}`,
      tipo: "prestamo" as const,
      titulo: "Préstamo registrado",
      detalle: p.cliente.nombreCompleto,
      monto: p.montoOriginal,
      fecha: p.createdAt,
    })),
  ];

  return movimientos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime()).slice(0, 6);
}
