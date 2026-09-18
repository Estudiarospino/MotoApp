-- CreateTable
CREATE TABLE "NotaContrato" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotaContrato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotaContrato_contratoId_idx" ON "NotaContrato"("contratoId");

-- AddForeignKey
ALTER TABLE "NotaContrato" ADD CONSTRAINT "NotaContrato_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
