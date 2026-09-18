"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { eliminarArchivo, guardarDocumento } from "@/lib/upload";

export type DocumentoFormState = { error?: string };

const TIPOS_VALIDOS = ["CEDULA", "COMPROBANTE_PAGO", "CONTRATO_FIRMADO", "OTRO"] as const;
type TipoDocumentoContrato = (typeof TIPOS_VALIDOS)[number];

function esTipoValido(valor: FormDataEntryValue | null): valor is TipoDocumentoContrato {
  return typeof valor === "string" && (TIPOS_VALIDOS as readonly string[]).includes(valor);
}

export async function subirDocumentoContrato(
  contratoId: string,
  _prevState: DocumentoFormState,
  formData: FormData,
): Promise<DocumentoFormState> {
  const archivo = formData.get("archivo");
  const tipo = formData.get("tipo");

  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Selecciona un archivo para subir." };
  }
  if (!esTipoValido(tipo)) {
    return { error: "Selecciona el tipo de documento." };
  }

  const resultado = await guardarDocumento(archivo, "documentos");
  if (!resultado.ok) {
    return { error: resultado.error };
  }

  await prisma.documento.create({
    data: {
      tipo,
      nombreOriginal: resultado.nombreOriginal,
      rutaAlmacenamiento: resultado.url,
      mimeType: resultado.mimeType,
      tamanioBytes: resultado.tamanioBytes,
      contratoId,
    },
  });

  revalidatePath(`/contratos/${contratoId}`);
  return {};
}

export async function eliminarDocumentoContrato(
  documentoId: string,
  contratoId: string,
  _prevState: DocumentoFormState,
  _formData: FormData,
): Promise<DocumentoFormState> {
  const documento = await prisma.documento.delete({ where: { id: documentoId } });
  await eliminarArchivo(documento.rutaAlmacenamiento);
  revalidatePath(`/contratos/${contratoId}`);
  return {};
}
