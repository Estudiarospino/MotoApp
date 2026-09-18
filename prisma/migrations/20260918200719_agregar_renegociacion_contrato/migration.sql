-- CreateTable
CREATE TABLE "RenegociacionContrato" (
    "id" TEXT NOT NULL,
    "contratoAnteriorId" TEXT NOT NULL,
    "contratoNuevoId" TEXT NOT NULL,
    "deudaTrasladada" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RenegociacionContrato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RenegociacionContrato_contratoAnteriorId_key" ON "RenegociacionContrato"("contratoAnteriorId");

-- CreateIndex
CREATE UNIQUE INDEX "RenegociacionContrato_contratoNuevoId_key" ON "RenegociacionContrato"("contratoNuevoId");

-- AddForeignKey
ALTER TABLE "RenegociacionContrato" ADD CONSTRAINT "RenegociacionContrato_contratoAnteriorId_fkey" FOREIGN KEY ("contratoAnteriorId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenegociacionContrato" ADD CONSTRAINT "RenegociacionContrato_contratoNuevoId_fkey" FOREIGN KEY ("contratoNuevoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
