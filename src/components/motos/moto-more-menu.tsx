"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { deleteMotocicletaSiNoTieneHistorial, type EliminarMotoResultado } from "@/app/(dashboard)/motos/actions";

const ESTADO_INICIAL: EliminarMotoResultado = {};

export function MotoMoreMenu({ motoId, puedeEliminar }: { motoId: string; puedeEliminar: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const accionConId = deleteMotocicletaSiNoTieneHistorial.bind(null, motoId);
  const [state, formAction, pending] = useActionState(accionConId, ESTADO_INICIAL);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Más acciones"
        className={buttonVariants({ variant: "outline", size: "icon-sm" })}
      >
        <MoreHorizontal className="size-4" />
      </button>

      {abierto && (
        <div className="absolute right-0 z-40 mt-2 w-52 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-lg">
          {puedeEliminar ? (
            <form action={formAction} onSubmit={() => setAbierto(false)}>
              <button
                type="submit"
                disabled={pending}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                <Trash2 className="size-4" />
                Eliminar moto
              </button>
            </form>
          ) : (
            <p className="px-2.5 py-1.5 text-xs text-muted-foreground">
              No se puede eliminar: tiene historial asociado.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
