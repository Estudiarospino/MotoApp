-- CreateEnum
CREATE TYPE "FrecuenciaPago" AS ENUM ('DIARIO', 'SEMANAL', 'QUINCENAL', 'MENSUAL');

-- AlterTable
ALTER TABLE "Contrato" ADD COLUMN     "frecuenciaPago" "FrecuenciaPago" NOT NULL DEFAULT 'MENSUAL';
