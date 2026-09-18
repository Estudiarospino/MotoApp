-- El enum "MetodoPago" se reemplaza por una tabla configurable. Se renombra
-- primero para poder crear la tabla nueva con el mismo nombre sin choque.
ALTER TYPE "MetodoPago" RENAME TO "MetodoPago_old";

-- CreateTable
CREATE TABLE "Cuenta" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "titular" TEXT NOT NULL,
    "banco" TEXT,
    "numeroCuenta" TEXT,
    "saldoInicial" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cuenta_activa_idx" ON "Cuenta"("activa");

-- CreateTable
CREATE TABLE "MetodoPago" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetodoPago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MetodoPago_cuentaId_idx" ON "MetodoPago"("cuentaId");
CREATE INDEX "MetodoPago_activo_idx" ON "MetodoPago"("activo");

-- AddForeignKey
ALTER TABLE "MetodoPago" ADD CONSTRAINT "MetodoPago_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Semilla: cuenta y métodos de arranque, punto de partida para los pagos ya existentes
INSERT INTO "Cuenta" ("id", "nombre", "titular", "saldoInicial", "activa", "createdAt", "updatedAt")
VALUES ('cta_seed_principal', 'Cuenta principal', 'Por definir', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "MetodoPago" ("id", "nombre", "cuentaId", "activo", "createdAt", "updatedAt")
VALUES
  ('mp_seed_transferencia', 'Transferencia', 'cta_seed_principal', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('mp_seed_efectivo', 'Efectivo', 'cta_seed_principal', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('mp_seed_otro', 'Otro', 'cta_seed_principal', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Pago: columna nueva, backfill desde el enum viejo, luego se vuelve obligatoria
ALTER TABLE "Pago" ADD COLUMN "metodoPagoId" TEXT;

UPDATE "Pago" SET "metodoPagoId" = CASE "metodo"::text
  WHEN 'TRANSFERENCIA' THEN 'mp_seed_transferencia'
  WHEN 'EFECTIVO' THEN 'mp_seed_efectivo'
  WHEN 'OTRO' THEN 'mp_seed_otro'
END;

ALTER TABLE "Pago" ALTER COLUMN "metodoPagoId" SET NOT NULL;
ALTER TABLE "Pago" DROP COLUMN "metodo";

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_metodoPagoId_fkey" FOREIGN KEY ("metodoPagoId") REFERENCES "MetodoPago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Gasto: opcional, sin backfill (queda nulo en gastos anteriores a esta función)
ALTER TABLE "Gasto" ADD COLUMN "metodoPagoId" TEXT;
CREATE INDEX "Gasto_metodoPagoId_idx" ON "Gasto"("metodoPagoId");
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_metodoPagoId_fkey" FOREIGN KEY ("metodoPagoId") REFERENCES "MetodoPago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- El enum viejo ya no lo usa nadie
DROP TYPE "MetodoPago_old";
