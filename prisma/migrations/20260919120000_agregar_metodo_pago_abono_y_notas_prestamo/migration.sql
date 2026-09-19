-- AbonoPrestamo: método de pago opcional (nulo en abonos anteriores a esta función)
ALTER TABLE "AbonoPrestamo" ADD COLUMN "metodoPagoId" TEXT;
CREATE INDEX "AbonoPrestamo_metodoPagoId_idx" ON "AbonoPrestamo"("metodoPagoId");
ALTER TABLE "AbonoPrestamo" ADD CONSTRAINT "AbonoPrestamo_metodoPagoId_fkey" FOREIGN KEY ("metodoPagoId") REFERENCES "MetodoPago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "NotaPrestamo" (
    "id" TEXT NOT NULL,
    "prestamoId" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotaPrestamo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotaPrestamo_prestamoId_idx" ON "NotaPrestamo"("prestamoId");

-- AddForeignKey
ALTER TABLE "NotaPrestamo" ADD CONSTRAINT "NotaPrestamo_prestamoId_fkey" FOREIGN KEY ("prestamoId") REFERENCES "Prestamo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
