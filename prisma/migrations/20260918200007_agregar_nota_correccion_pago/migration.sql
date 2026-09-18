-- AlterTable
ALTER TABLE "NotaContrato" ADD COLUMN     "pagoId" TEXT;

-- CreateIndex
CREATE INDEX "NotaContrato_pagoId_idx" ON "NotaContrato"("pagoId");

-- AddForeignKey
ALTER TABLE "NotaContrato" ADD CONSTRAINT "NotaContrato_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;
