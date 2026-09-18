import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const EXTENSION_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"] as const;
const TIPOS_DOCUMENTO = [...TIPOS_IMAGEN, "application/pdf"] as const;

const TAMANIO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5MB

export type ResultadoGuardarArchivo =
  | { ok: true; url: string; nombreOriginal: string; mimeType: string; tamanioBytes: number }
  | { ok: false; error: string };

/** Guarda un archivo subido por el usuario en `public/uploads/<carpeta>/` y devuelve su URL pública. */
async function guardarArchivo(
  file: File,
  carpeta: string,
  tiposPermitidos: readonly string[],
  mensajeFormato: string,
): Promise<ResultadoGuardarArchivo> {
  const extension = EXTENSION_POR_TIPO[file.type];
  if (!extension || !tiposPermitidos.includes(file.type)) {
    return { ok: false, error: mensajeFormato };
  }
  if (file.size > TAMANIO_MAXIMO_BYTES) {
    return { ok: false, error: "El archivo supera el tamaño máximo de 5MB." };
  }

  const nombreArchivo = `${randomUUID()}.${extension}`;
  const carpetaDestino = path.join(process.cwd(), "public", "uploads", carpeta);
  await mkdir(carpetaDestino, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(carpetaDestino, nombreArchivo), buffer);

  return {
    ok: true,
    url: `/uploads/${carpeta}/${nombreArchivo}`,
    nombreOriginal: file.name,
    mimeType: file.type,
    tamanioBytes: file.size,
  };
}

export type ResultadoGuardarImagen = { ok: true; url: string } | { ok: false; error: string };

/** Guarda una imagen (JPG/PNG/WEBP) — usado para fotos de portada como la de una moto. */
export async function guardarImagen(file: File, carpeta: string): Promise<ResultadoGuardarImagen> {
  const resultado = await guardarArchivo(
    file,
    carpeta,
    TIPOS_IMAGEN,
    "Formato de imagen no soportado. Usa JPG, PNG o WEBP.",
  );
  return resultado.ok ? { ok: true, url: resultado.url } : resultado;
}

/** Guarda un documento adjunto (JPG/PNG/WEBP/PDF) — usado para archivos ligados a un registro (Documento). */
export async function guardarDocumento(file: File, carpeta: string): Promise<ResultadoGuardarArchivo> {
  return guardarArchivo(file, carpeta, TIPOS_DOCUMENTO, "Formato no soportado. Usa JPG, PNG, WEBP o PDF.");
}

/** Borra (best-effort) un archivo previamente guardado con `guardarImagen`/`guardarDocumento`. */
export async function eliminarArchivo(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith("/uploads/")) return;
  try {
    await unlink(path.join(process.cwd(), "public", url));
  } catch {
    // El archivo ya no existe o no se pudo borrar: no es crítico.
  }
}
