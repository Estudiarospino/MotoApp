/**
 * Datos de prueba para ver el diseño en acción con información realista.
 * No se ejecuta automáticamente — correr con: npm run db:seed-demo
 *
 * Usa el motor de cierre real (cerrarPeriodoNormal, cerrarPorIncumplimiento,
 * ejecutarCompraAnticipada) para los contratos, en vez de fabricar los
 * estados finales a mano, así los datos quedan internamente consistentes
 * (saldo de capital, historial de periodos, estado de la moto, etc.)
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { cerrarPeriodoNormal, cerrarPorIncumplimiento } from "../src/server/engine/cierreService";
import { ejecutarCompraAnticipada } from "../src/server/engine/compraAnticipadaService";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function fechaHace(dias: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - dias);
  return d;
}

async function crearContratoActivo(opts: {
  clienteId: string;
  motocicletaId: string;
  valorTotalContrato: number;
  arriendoFijoMensual: number;
  metaMensualReferencia?: number;
  cuotaDiariaReferencia?: number;
  fechaInicio: Date;
}) {
  await prisma.motocicleta.update({ where: { id: opts.motocicletaId }, data: { estado: "EN_CONTRATO" } });
  return prisma.contrato.create({
    data: {
      clienteId: opts.clienteId,
      motocicletaId: opts.motocicletaId,
      valorTotalContrato: opts.valorTotalContrato,
      arriendoFijoMensual: opts.arriendoFijoMensual,
      metaMensualReferencia: opts.metaMensualReferencia,
      cuotaDiariaReferencia: opts.cuotaDiariaReferencia,
      fechaInicio: opts.fechaInicio,
      saldoCapitalPendiente: opts.valorTotalContrato,
      fechaAperturaPeriodoActual: opts.fechaInicio,
    },
  });
}

let metodoPagoIdPorDefecto: string;

async function registrarPago(contratoId: string, fecha: Date, monto: number) {
  await prisma.pago.create({ data: { contratoId, fecha, monto, metodoPagoId: metodoPagoIdPorDefecto } });
}

async function main() {
  const metodoDefecto = await prisma.metodoPago.findFirst({ where: { activo: true } });
  if (!metodoDefecto) {
    throw new Error(
      "No hay métodos de pago configurados. Aplica las migraciones (traen la semilla de Cuenta/MetodoPago) antes de correr este script.",
    );
  }
  metodoPagoIdPorDefecto = metodoDefecto.id;

  console.log("Creando clientes...");
  const [cliente1, cliente2, cliente3, cliente4, cliente5, cliente6, cliente7, cliente8] = await Promise.all([
    prisma.cliente.create({
      data: { nombreCompleto: "Andrés Torres Gómez", numeroIdentificacion: "1015234567", telefono: "3101234567", email: "andres.torres@example.com", direccion: "Cra 45 #12-30, Medellín" },
    }),
    prisma.cliente.create({
      data: { nombreCompleto: "Laura Jiménez Rojas", numeroIdentificacion: "1022456789", telefono: "3129876543", email: "laura.jimenez@example.com", direccion: "Calle 80 #23-14, Bogotá" },
    }),
    prisma.cliente.create({
      data: { nombreCompleto: "Carlos Andrés Pérez", numeroIdentificacion: "79345612", telefono: "3204567890", direccion: "Barrio San Javier, Medellín" },
    }),
    prisma.cliente.create({
      data: { nombreCompleto: "María Fernanda López", numeroIdentificacion: "52678901", telefono: "3115678901", email: "mfernanda.lopez@example.com" },
    }),
    prisma.cliente.create({
      data: { nombreCompleto: "Jhon Alexander Ruiz", numeroIdentificacion: "1013456789", telefono: "3167890123" },
    }),
    prisma.cliente.create({
      data: { nombreCompleto: "Diana Carolina Suárez", numeroIdentificacion: "1030567890", telefono: "3187654321", email: "diana.suarez@example.com", notas: "Cliente referida por Andrés Torres." },
    }),
    prisma.cliente.create({
      data: {
        nombreCompleto: "Wilson Steven Martínez",
        numeroIdentificacion: "1120345678",
        telefono: "3193456789",
        activo: false,
        notas: "Ya no está activo — entregó la moto por incumplimiento.",
      },
    }),
    prisma.cliente.create({
      data: { nombreCompleto: "Yesenia Paola Castro", numeroIdentificacion: "1098765432", telefono: "3142345678", email: "yesenia.castro@example.com" },
    }),
  ]);

  console.log("Creando motocicletas...");
  const [moto1, moto2, moto3, moto4, moto5, moto6, moto7, moto8, moto9, moto10] = await Promise.all([
    prisma.motocicleta.create({
      data: {
        marca: "Bajaj", modelo: "Boxer CT100", placa: "ABC12D", color: "Negro", anioModelo: 2023,
        precioInicial: 5_700_000,
        soatFechaExpedicion: fechaHace(425), // vencido
        tecnomecanicaFechaExpedicion: fechaHace(60), // vigente
      },
    }),
    prisma.motocicleta.create({
      data: {
        marca: "AKT", modelo: "NKD 125", placa: "XYZ34E", color: "Azul", anioModelo: 2024,
        precioInicial: 6_200_000,
        soatFechaExpedicion: fechaHace(350), // vence pronto (~15 días)
        tecnomecanicaFechaExpedicion: fechaHace(380), // vencida
      },
    }),
    prisma.motocicleta.create({
      data: {
        marca: "Yamaha", modelo: "FZ 2.0", placa: "JKL56F", color: "Rojo", anioModelo: 2024,
        precioInicial: 8_500_000,
        soatFechaExpedicion: fechaHace(60),
        tecnomecanicaFechaExpedicion: fechaHace(45),
      },
    }),
    prisma.motocicleta.create({
      data: { marca: "Honda", modelo: "CB160F", placa: "MNO78G", color: "Gris", anioModelo: 2022, precioInicial: 4_800_000 },
    }),
    prisma.motocicleta.create({
      data: {
        marca: "Suzuki", modelo: "GN125", placa: "PQR90H", color: "Negro", anioModelo: 2023,
        precioInicial: 5_100_000,
        soatFechaExpedicion: fechaHace(90),
        tecnomecanicaFechaExpedicion: fechaHace(100),
      },
    }),
    prisma.motocicleta.create({
      data: {
        marca: "AKT", modelo: "CR4", placa: "STU12I", color: "Verde", anioModelo: 2021,
        precioInicial: 4_500_000,
        soatFechaExpedicion: fechaHace(400), // vencido
        tecnomecanicaFechaExpedicion: fechaHace(355), // vence pronto
      },
    }),
    prisma.motocicleta.create({
      data: {
        marca: "Bajaj", modelo: "Pulsar NS160", placa: "VWX34J", color: "Rojo", anioModelo: 2024,
        precioInicial: 7_900_000,
        soatFechaExpedicion: fechaHace(20),
        tecnomecanicaFechaExpedicion: fechaHace(15),
      },
    }),
    prisma.motocicleta.create({
      data: {
        marca: "TVS", modelo: "Apache RTR", placa: "YZA56K", color: "Negro", anioModelo: 2023,
        precioInicial: 7_200_000,
        soatFechaExpedicion: fechaHace(120),
        tecnomecanicaFechaExpedicion: fechaHace(110),
      },
    }),
    prisma.motocicleta.create({
      data: { marca: "Auteco", modelo: "Boxer BM100", placa: "BCD78L", color: "Blanco", anioModelo: 2020, precioInicial: 3_900_000 },
    }),
    prisma.motocicleta.create({
      data: {
        marca: "Kymco", modelo: "Agility 125", placa: "EFG90M", color: "Amarillo", anioModelo: 2024,
        precioInicial: 6_600_000,
        soatFechaExpedicion: fechaHace(200),
        tecnomecanicaFechaExpedicion: fechaHace(180),
      },
    }),
  ]);

  console.log("Creando contrato 1: ACTIVO, al día (2 periodos cerrados + uno abierto)...");
  const contrato1 = await crearContratoActivo({
    clienteId: cliente1.id,
    motocicletaId: moto1.id,
    valorTotalContrato: 5_700_000,
    arriendoFijoMensual: 350_000,
    metaMensualReferencia: 650_000,
    cuotaDiariaReferencia: 25_000,
    fechaInicio: fechaHace(130),
  });
  await registrarPago(contrato1.id, fechaHace(125), 300_000);
  await registrarPago(contrato1.id, fechaHace(110), 350_000);
  await cerrarPeriodoNormal(contrato1.id); // periodo 1: cubre arriendo + 300k a capital
  await registrarPago(contrato1.id, fechaHace(95), 650_000);
  await cerrarPeriodoNormal(contrato1.id); // periodo 2: cubre arriendo + 300k a capital
  await registrarPago(contrato1.id, fechaHace(20), 400_000); // periodo 3 abierto, en curso

  console.log("Creando contrato 2: ACTIVO, en mora...");
  const contrato2 = await crearContratoActivo({
    clienteId: cliente2.id,
    motocicletaId: moto2.id,
    valorTotalContrato: 6_200_000,
    arriendoFijoMensual: 380_000,
    metaMensualReferencia: 700_000,
    fechaInicio: fechaHace(70),
  });
  await registrarPago(contrato2.id, fechaHace(65), 220_000); // no alcanza a cubrir el arriendo
  await cerrarPeriodoNormal(contrato2.id); // genera mora de 160.000
  await registrarPago(contrato2.id, fechaHace(10), 100_000); // sigue sin ponerse al día

  console.log("Creando contrato 3: ACTIVO, periodo abierto hace mucho tiempo, sin pagos...");
  const contrato3 = await crearContratoActivo({
    clienteId: cliente3.id,
    motocicletaId: moto3.id,
    valorTotalContrato: 8_500_000,
    arriendoFijoMensual: 420_000,
    fechaInicio: fechaHace(50),
  });
  // Simula que el dueño no ha cerrado el periodo hace más de UMBRAL_PERIODO_ABIERTO_DIAS
  await prisma.contrato.update({
    where: { id: contrato3.id },
    data: { fechaAperturaPeriodoActual: fechaHace(50) },
  });

  console.log("Creando contrato 4: se paga en su totalidad (FINALIZADO_PAGADO)...");
  const contrato4 = await crearContratoActivo({
    clienteId: cliente4.id,
    motocicletaId: moto4.id,
    valorTotalContrato: 1_200_000,
    arriendoFijoMensual: 150_000,
    fechaInicio: fechaHace(150),
  });
  await registrarPago(contrato4.id, fechaHace(140), 750_000);
  await cerrarPeriodoNormal(contrato4.id); // arriendo 150k + 600k a capital -> saldo 600k
  await registrarPago(contrato4.id, fechaHace(100), 750_000);
  await cerrarPeriodoNormal(contrato4.id); // arriendo 150k + 600k a capital -> saldo 0, FINALIZADO_PAGADO

  console.log("Creando contrato 5: compra anticipada (FINALIZADO_COMPRADO)...");
  const contrato5 = await crearContratoActivo({
    clienteId: cliente5.id,
    motocicletaId: moto5.id,
    valorTotalContrato: 5_100_000,
    arriendoFijoMensual: 320_000,
    fechaInicio: fechaHace(80),
  });
  await registrarPago(contrato5.id, fechaHace(75), 620_000);
  await cerrarPeriodoNormal(contrato5.id); // saldo baja a 5.100.000 - 300.000 = 4.800.000
  await registrarPago(contrato5.id, fechaHace(5), 5_200_000); // paga arriendo + todo el capital restante de una vez
  const resultadoCompra = await ejecutarCompraAnticipada(contrato5.id);
  if (!resultadoCompra.aceptada) {
    throw new Error("La compra anticipada de demostración debería haberse aceptado");
  }

  console.log("Creando contrato 6: incumplimiento (INCUMPLIDO_RECUPERADA)...");
  const contrato6 = await crearContratoActivo({
    clienteId: cliente7.id, // el cliente inactivo — coincide con la nota "entregó la moto"
    motocicletaId: moto6.id,
    valorTotalContrato: 4_500_000,
    arriendoFijoMensual: 280_000,
    fechaInicio: fechaHace(160),
  });
  await registrarPago(contrato6.id, fechaHace(150), 500_000);
  await cerrarPeriodoNormal(contrato6.id);
  await registrarPago(contrato6.id, fechaHace(40), 100_000); // dejó de pagar
  await cerrarPorIncumplimiento(contrato6.id);

  console.log("Creando gastos...");
  await Promise.all([
    prisma.gasto.create({ data: { motocicletaId: moto1.id, contratoId: contrato1.id, fecha: fechaHace(100), categoria: "MANTENIMIENTO", descripcion: "Cambio de aceite y filtro", monto: 80_000 } }),
    prisma.gasto.create({ data: { motocicletaId: moto2.id, contratoId: contrato2.id, fecha: fechaHace(50), categoria: "REPARACION", descripcion: "Cambio de llanta trasera", monto: 220_000 } }),
    prisma.gasto.create({ data: { motocicletaId: moto1.id, fecha: fechaHace(30), categoria: "SEGURO", descripcion: "Póliza todo riesgo", monto: 350_000 } }),
    prisma.gasto.create({ data: { motocicletaId: moto4.id, fecha: fechaHace(120), categoria: "IMPUESTOS", descripcion: "Impuesto de rodamiento", monto: 180_000 } }),
    prisma.gasto.create({ data: { motocicletaId: moto3.id, fecha: fechaHace(10), categoria: "OTRO", descripcion: "Lavado y detallado", monto: 25_000 } }),
  ]);

  console.log("Creando préstamos...");
  const prestamo1 = await prisma.prestamo.create({
    data: { clienteId: cliente1.id, contratoId: contrato1.id, fecha: fechaHace(90), montoOriginal: 500_000, saldoPendiente: 500_000, motivo: "Imprevisto familiar" },
  });
  await prisma.abonoPrestamo.create({ data: { prestamoId: prestamo1.id, fecha: fechaHace(30), monto: 200_000 } });
  await prisma.prestamo.update({ where: { id: prestamo1.id }, data: { saldoPendiente: 300_000 } });

  await prisma.prestamo.create({
    data: { clienteId: cliente3.id, contratoId: contrato3.id, fecha: fechaHace(40), montoOriginal: 300_000, saldoPendiente: 300_000, motivo: "Repuesto urgente" },
  });

  // cliente5 (contrato5) ya terminó en compra anticipada — este préstamo pagado usa
  // a cliente2, que sigue con un contrato activo, para respetar la regla de negocio.
  const prestamo3 = await prisma.prestamo.create({
    data: { clienteId: cliente2.id, contratoId: contrato2.id, fecha: fechaHace(60), montoOriginal: 400_000, saldoPendiente: 400_000, motivo: "Adelanto de nómina" },
  });
  await prisma.abonoPrestamo.create({ data: { prestamoId: prestamo3.id, fecha: fechaHace(40), monto: 250_000 } });
  await prisma.abonoPrestamo.create({ data: { prestamoId: prestamo3.id, fecha: fechaHace(15), monto: 150_000 } });
  await prisma.prestamo.update({ where: { id: prestamo3.id }, data: { saldoPendiente: 0, estado: "PAGADO" } });

  console.log("\nListo. Resumen:");
  console.log("- 8 clientes (1 inactivo)");
  console.log("- 10 motos: 3 en contrato, 2 vendidas, 5 disponibles");
  console.log("- 6 contratos: 3 activos (al día / en mora / periodo abierto hace mucho), 1 pagado, 1 comprado, 1 incumplido");
  console.log("- 5 gastos, 3 préstamos (2 activos, 1 pagado)");
}

main()
  .catch((e) => {
    console.error("\nERROR sembrando datos de prueba:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
