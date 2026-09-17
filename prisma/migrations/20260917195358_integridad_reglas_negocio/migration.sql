-- Reglas de integridad que Prisma no puede expresar en el DSL del schema
-- (ver docs/PROYECTO.md, sección "Modelo de datos"). Defensa en profundidad
-- a nivel de base de datos, además de la validación en la aplicación.

-- Una moto no puede tener dos contratos ACTIVO al mismo tiempo.
CREATE UNIQUE INDEX "Contrato_motocicletaId_activo_key"
  ON "Contrato" ("motocicletaId")
  WHERE "estado" = 'ACTIVO';

-- Montos siempre positivos.
ALTER TABLE "Motocicleta" ADD CONSTRAINT "Motocicleta_precioInicial_positivo" CHECK ("precioInicial" > 0);
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_valorTotalContrato_positivo" CHECK ("valorTotalContrato" > 0);
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_arriendoFijoMensual_positivo" CHECK ("arriendoFijoMensual" > 0);
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_monto_positivo" CHECK ("monto" > 0);
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_monto_positivo" CHECK ("monto" > 0);
ALTER TABLE "Prestamo" ADD CONSTRAINT "Prestamo_montoOriginal_positivo" CHECK ("montoOriginal" > 0);
ALTER TABLE "AbonoPrestamo" ADD CONSTRAINT "AbonoPrestamo_monto_positivo" CHECK ("monto" > 0);

-- Saldos y mora nunca negativos.
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_saldoCapitalPendiente_no_negativo" CHECK ("saldoCapitalPendiente" >= 0);
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_moraAcumulada_no_negativa" CHECK ("moraAcumulada" >= 0);
ALTER TABLE "Prestamo" ADD CONSTRAINT "Prestamo_saldoPendiente_no_negativo" CHECK ("saldoPendiente" >= 0);

-- Un Documento siempre debe estar ligado a algo.
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_al_menos_una_relacion" CHECK (
  num_nonnulls(
    "clienteId", "contratoId", "pagoId", "periodoCierreId",
    "gastoId", "prestamoId", "abonoPrestamoId"
  ) >= 1
);
