"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleActivoMetodoPago } from "./actions";

export function ToggleMetodoButton({ id, activo }: { id: string; activo: boolean }) {
  const [pending, startTransition] = useTransition();

  function alClick() {
    startTransition(async () => {
      const resultado = await toggleActivoMetodoPago(id);
      if (resultado.error) toast.error(resultado.error);
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={alClick}
      className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
    >
      {activo ? "Desactivar" : "Activar"}
    </button>
  );
}
