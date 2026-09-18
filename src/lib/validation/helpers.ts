import { z } from "zod";

/** Campo de texto que viene de un <form> (siempre string): vacío se vuelve `undefined`. */
export const textoOpcional = z
  .string()
  .transform((v) => v.trim())
  .transform((v) => (v === "" ? undefined : v));

/** Igual que `textoOpcional`, pero valida formato de correo cuando no está vacío. */
export const emailOpcional = z
  .string()
  .trim()
  .toLowerCase()
  .transform((v) => (v === "" ? undefined : v))
  .pipe(z.email().optional());

/** Convierte el string de un <input type="number"> en un entero de pesos (COP). */
export const pesosDesdeFormulario = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : v),
  z.coerce.number().int("Debe ser un número entero").nonnegative("No puede ser negativo"),
);

/** Igual que `pesosDesdeFormulario`, pero exige un valor mayor a cero. */
export const pesosPositivosDesdeFormulario = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : v),
  z.coerce.number().int("Debe ser un número entero").positive("Debe ser mayor a cero"),
);

/** Igual que `pesosDesdeFormulario`, pero opcional (vacío se vuelve `undefined`). */
export const pesosOpcionalDesdeFormulario = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.coerce.number().int("Debe ser un número entero").positive("Debe ser mayor a cero").optional(),
);

/** Convierte el string de un <input type="date"> (YYYY-MM-DD) en un `Date`. */
export const fechaDesdeFormulario = z.iso.date("Ingresa una fecha válida").pipe(z.coerce.date());

/** Igual que `fechaDesdeFormulario`, pero opcional (vacío se vuelve `undefined`). */
export const fechaOpcionalDesdeFormulario = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.iso.date("Ingresa una fecha válida").pipe(z.coerce.date()).optional(),
);
