-- Los préstamos ahora se otorgan siempre contra un contrato activo del cliente
-- (la moto se resuelve vía contrato.motocicleta, ya no queda suelta en Prestamo).

-- Backfill de seguridad por si esta migración corre en un ambiente con datos
-- viejos que aún no pasaron por el backfill manual (no-op si ya no hay nulos).
UPDATE "Prestamo" p
SET "contratoId" = ct.id
FROM "Contrato" ct
WHERE p."contratoId" IS NULL
  AND ct."clienteId" = p."clienteId"
  AND ct.estado = 'ACTIVO';

-- DropForeignKey
ALTER TABLE "Prestamo" DROP CONSTRAINT "Prestamo_motocicletaId_fkey";

-- AlterTable
ALTER TABLE "Prestamo" DROP COLUMN "motocicletaId";

-- DropForeignKey
ALTER TABLE "Prestamo" DROP CONSTRAINT "Prestamo_contratoId_fkey";

-- AlterTable
ALTER TABLE "Prestamo" ALTER COLUMN "contratoId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Prestamo" ADD CONSTRAINT "Prestamo_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Prestamo_contratoId_idx" ON "Prestamo"("contratoId");
