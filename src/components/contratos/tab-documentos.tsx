"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Download, File, FileText, Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  eliminarDocumentoContrato,
  subirDocumentoContrato,
  type DocumentoFormState,
} from "@/app/(dashboard)/contratos/documentos-actions";

const ESTADO_INICIAL: DocumentoFormState = {};

const TIPO_LABEL: Record<string, string> = {
  CEDULA: "Cédula",
  COMPROBANTE_PAGO: "Comprobante de pago",
  CONTRATO_FIRMADO: "Contrato firmado",
  OTRO: "Otro",
};

function BotonSubir() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      <Upload data-icon="inline-start" className="size-4" />
      {pending ? "Subiendo..." : "Subir documento"}
    </Button>
  );
}

function iconoPorMime(mimeType: string) {
  return mimeType.startsWith("image/") ? ImageIcon : mimeType === "application/pdf" ? FileText : File;
}

function formatoTamanio(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function BotonEliminarDocumento({ documentoId, contratoId }: { documentoId: string; contratoId: string }) {
  const accionConId = eliminarDocumentoContrato.bind(null, documentoId, contratoId);
  const [state, formAction, pending] = useActionState(accionConId, ESTADO_INICIAL);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <form action={formAction}>
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        aria-label="Eliminar documento"
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>
    </form>
  );
}

export type DocumentoItem = {
  id: string;
  tipo: string;
  nombreOriginal: string;
  rutaAlmacenamiento: string;
  mimeType: string;
  tamanioBytes: number;
  createdAt: string;
};

export function TabDocumentos({ contratoId, documentos }: { contratoId: string; documentos: DocumentoItem[] }) {
  const action = subirDocumentoContrato.bind(null, contratoId);
  const [state, formAction] = useActionState(action, ESTADO_INICIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error) formRef.current?.reset();
  }, [state]);

  return (
    <div className="flex flex-col gap-4">
      <form ref={formRef} action={formAction} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-end">
        {state.error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive sm:hidden">{state.error}</p>
        )}
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="archivo">Archivo</Label>
          <input
            id="archivo"
            name="archivo"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            required
            className="text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-2.5 file:py-1 file:text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="tipo">Tipo</Label>
          <Select name="tipo" defaultValue="OTRO">
            <SelectTrigger id="tipo" className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TIPO_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <BotonSubir />
      </form>
      {state.error && <p className="hidden rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive sm:block">{state.error}</p>}

      {documentos.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Todavía no hay documentos adjuntos.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {documentos.map((doc) => {
            const Icono = iconoPorMime(doc.mimeType);
            return (
              <div key={doc.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icono className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{doc.nombreOriginal}</p>
                  <p className="text-xs text-muted-foreground">
                    {TIPO_LABEL[doc.tipo] ?? doc.tipo} · {formatoTamanio(doc.tamanioBytes)} · {doc.createdAt}
                  </p>
                </div>
                <Link
                  href={doc.rutaAlmacenamiento}
                  target="_blank"
                  aria-label="Descargar documento"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-background hover:text-foreground"
                >
                  <Download className="size-4" />
                </Link>
                <BotonEliminarDocumento documentoId={doc.id} contratoId={contratoId} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
