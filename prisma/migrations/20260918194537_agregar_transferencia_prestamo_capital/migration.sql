-- CreateTable
CREATE TABLE "TransferenciaPrestamoCapital" (
    "id" TEXT NOT NULL,
    "prestamoId" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferenciaPrestamoCapital_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransferenciaPrestamoCapital_prestamoId_idx" ON "TransferenciaPrestamoCapital"("prestamoId");

-- CreateIndex
CREATE INDEX "TransferenciaPrestamoCapital_contratoId_idx" ON "TransferenciaPrestamoCapital"("contratoId");

-- AddForeignKey
ALTER TABLE "TransferenciaPrestamoCapital" ADD CONSTRAINT "TransferenciaPrestamoCapital_prestamoId_fkey" FOREIGN KEY ("prestamoId") REFERENCES "Prestamo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaPrestamoCapital" ADD CONSTRAINT "TransferenciaPrestamoCapital_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
