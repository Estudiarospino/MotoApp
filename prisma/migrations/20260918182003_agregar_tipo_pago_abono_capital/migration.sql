-- CreateEnum
CREATE TYPE "TipoPago" AS ENUM ('ARRIENDO', 'ABONO_CAPITAL');

-- AlterTable
ALTER TABLE "Pago" ADD COLUMN     "tipo" "TipoPago" NOT NULL DEFAULT 'ARRIENDO';
