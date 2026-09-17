-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "TipoIdentificacion" AS ENUM ('CC', 'CE', 'PASAPORTE', 'NIT', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoMoto" AS ENUM ('DISPONIBLE', 'EN_CONTRATO', 'VENDIDA');

-- CreateEnum
CREATE TYPE "EstadoContrato" AS ENUM ('ACTIVO', 'FINALIZADO_PAGADO', 'FINALIZADO_COMPRADO', 'INCUMPLIDO_RECUPERADA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('TRANSFERENCIA', 'EFECTIVO', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoCierre" AS ENUM ('NORMAL', 'COMPRA_ANTICIPADA');

-- CreateEnum
CREATE TYPE "CategoriaGasto" AS ENUM ('MANTENIMIENTO', 'REPARACION', 'SEGURO', 'IMPUESTOS', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoPrestamo" AS ENUM ('ACTIVO', 'PAGADO');

-- CreateEnum
CREATE TYPE "TipoArchivo" AS ENUM ('CEDULA', 'COMPROBANTE_PAGO', 'CONTRATO_FIRMADO', 'RECIBO_PERIODO', 'SOPORTE_GASTO', 'SOPORTE_PRESTAMO', 'OTRO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'ADMIN',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sesion" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "tipoIdentificacion" "TipoIdentificacion" NOT NULL DEFAULT 'CC',
    "numeroIdentificacion" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Motocicleta" (
    "id" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "color" TEXT,
    "anioModelo" INTEGER,
    "precioInicial" INTEGER NOT NULL,
    "estado" "EstadoMoto" NOT NULL DEFAULT 'DISPONIBLE',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Motocicleta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL,
    "folio" SERIAL NOT NULL,
    "clienteId" TEXT NOT NULL,
    "motocicletaId" TEXT NOT NULL,
    "valorTotalContrato" INTEGER NOT NULL,
    "arriendoFijoMensual" INTEGER NOT NULL,
    "metaMensualReferencia" INTEGER,
    "cuotaDiariaReferencia" INTEGER,
    "fechaInicio" DATE NOT NULL,
    "fechaFinEstimada" DATE,
    "saldoCapitalPendiente" INTEGER NOT NULL,
    "moraAcumulada" INTEGER NOT NULL DEFAULT 0,
    "fechaAperturaPeriodoActual" DATE NOT NULL,
    "estado" "EstadoContrato" NOT NULL DEFAULT 'ACTIVO',
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finalizadoAt" TIMESTAMP(3),

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "periodoCierreId" TEXT,
    "fecha" DATE NOT NULL,
    "monto" INTEGER NOT NULL,
    "metodo" "MetodoPago" NOT NULL DEFAULT 'TRANSFERENCIA',
    "referencia" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodoCierre" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "numeroPeriodo" INTEGER NOT NULL,
    "tipoCierre" "TipoCierre" NOT NULL DEFAULT 'NORMAL',
    "fechaAperturaPeriodo" DATE NOT NULL,
    "fechaCierre" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moraAnterior" INTEGER NOT NULL,
    "arriendoFijoUsado" INTEGER NOT NULL,
    "metaArriendo" INTEGER NOT NULL,
    "cobradoPeriodo" INTEGER NOT NULL,
    "arriendoCubierto" INTEGER NOT NULL,
    "abonoCapital" INTEGER NOT NULL,
    "moraNueva" INTEGER NOT NULL,
    "saldoCapitalAnterior" INTEGER NOT NULL,
    "saldoCapitalNuevo" INTEGER NOT NULL,
    "excedenteNoAplicado" INTEGER NOT NULL DEFAULT 0,
    "contratoFinalizado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeriodoCierre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL,
    "motocicletaId" TEXT NOT NULL,
    "contratoId" TEXT,
    "fecha" DATE NOT NULL,
    "categoria" "CategoriaGasto" NOT NULL DEFAULT 'MANTENIMIENTO',
    "descripcion" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prestamo" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "motocicletaId" TEXT,
    "contratoId" TEXT,
    "fecha" DATE NOT NULL,
    "montoOriginal" INTEGER NOT NULL,
    "saldoPendiente" INTEGER NOT NULL,
    "motivo" TEXT,
    "estado" "EstadoPrestamo" NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prestamo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbonoPrestamo" (
    "id" TEXT NOT NULL,
    "prestamoId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "monto" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbonoPrestamo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "tipo" "TipoArchivo" NOT NULL,
    "nombreOriginal" TEXT NOT NULL,
    "rutaAlmacenamiento" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanioBytes" INTEGER NOT NULL,
    "clienteId" TEXT,
    "contratoId" TEXT,
    "pagoId" TEXT,
    "periodoCierreId" TEXT,
    "gastoId" TEXT,
    "prestamoId" TEXT,
    "abonoPrestamoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Sesion_tokenHash_key" ON "Sesion"("tokenHash");

-- CreateIndex
CREATE INDEX "Sesion_usuarioId_idx" ON "Sesion"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_numeroIdentificacion_key" ON "Cliente"("numeroIdentificacion");

-- CreateIndex
CREATE UNIQUE INDEX "Motocicleta_placa_key" ON "Motocicleta"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_folio_key" ON "Contrato"("folio");

-- CreateIndex
CREATE INDEX "Contrato_estado_idx" ON "Contrato"("estado");

-- CreateIndex
CREATE INDEX "Contrato_clienteId_idx" ON "Contrato"("clienteId");

-- CreateIndex
CREATE INDEX "Contrato_motocicletaId_idx" ON "Contrato"("motocicletaId");

-- CreateIndex
CREATE INDEX "Pago_contratoId_periodoCierreId_idx" ON "Pago"("contratoId", "periodoCierreId");

-- CreateIndex
CREATE INDEX "Pago_fecha_idx" ON "Pago"("fecha");

-- CreateIndex
CREATE INDEX "PeriodoCierre_contratoId_idx" ON "PeriodoCierre"("contratoId");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodoCierre_contratoId_numeroPeriodo_key" ON "PeriodoCierre"("contratoId", "numeroPeriodo");

-- CreateIndex
CREATE INDEX "Gasto_motocicletaId_idx" ON "Gasto"("motocicletaId");

-- CreateIndex
CREATE INDEX "Gasto_contratoId_idx" ON "Gasto"("contratoId");

-- CreateIndex
CREATE INDEX "Prestamo_clienteId_idx" ON "Prestamo"("clienteId");

-- CreateIndex
CREATE INDEX "AbonoPrestamo_prestamoId_idx" ON "AbonoPrestamo"("prestamoId");

-- CreateIndex
CREATE INDEX "Documento_contratoId_idx" ON "Documento"("contratoId");

-- CreateIndex
CREATE INDEX "Documento_clienteId_idx" ON "Documento"("clienteId");

-- AddForeignKey
ALTER TABLE "Sesion" ADD CONSTRAINT "Sesion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_motocicletaId_fkey" FOREIGN KEY ("motocicletaId") REFERENCES "Motocicleta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_periodoCierreId_fkey" FOREIGN KEY ("periodoCierreId") REFERENCES "PeriodoCierre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodoCierre" ADD CONSTRAINT "PeriodoCierre_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_motocicletaId_fkey" FOREIGN KEY ("motocicletaId") REFERENCES "Motocicleta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prestamo" ADD CONSTRAINT "Prestamo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prestamo" ADD CONSTRAINT "Prestamo_motocicletaId_fkey" FOREIGN KEY ("motocicletaId") REFERENCES "Motocicleta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prestamo" ADD CONSTRAINT "Prestamo_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbonoPrestamo" ADD CONSTRAINT "AbonoPrestamo_prestamoId_fkey" FOREIGN KEY ("prestamoId") REFERENCES "Prestamo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_periodoCierreId_fkey" FOREIGN KEY ("periodoCierreId") REFERENCES "PeriodoCierre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_gastoId_fkey" FOREIGN KEY ("gastoId") REFERENCES "Gasto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_prestamoId_fkey" FOREIGN KEY ("prestamoId") REFERENCES "Prestamo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_abonoPrestamoId_fkey" FOREIGN KEY ("abonoPrestamoId") REFERENCES "AbonoPrestamo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
