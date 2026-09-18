const PALETA_AVATAR = [
  { bg: "bg-pink-100", text: "text-pink-600" },
  { bg: "bg-teal-100", text: "text-teal-600" },
  { bg: "bg-green-100", text: "text-green-600" },
  { bg: "bg-blue-100", text: "text-blue-600" },
  { bg: "bg-violet-100", text: "text-violet-600" },
  { bg: "bg-orange-100", text: "text-orange-600" },
] as const;

/** Color de avatar determinístico a partir de una semilla (p. ej. el id del registro). */
export function colorAvatar(semilla: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < semilla.length; i++) hash = (hash * 31 + semilla.charCodeAt(i)) >>> 0;
  return PALETA_AVATAR[hash % PALETA_AVATAR.length];
}

/** Iniciales (máx. 2 letras) a partir de un nombre completo. */
export function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
