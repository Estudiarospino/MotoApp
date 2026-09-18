"use client";

import { useTransition } from "react";
import { toggleActivaCuenta } from "./actions";

export function ToggleCuentaButton({ id, activa }: { id: string; activa: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleActivaCuenta(id))}
      className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
    >
      {activa ? "Desactivar" : "Activar"}
    </button>
  );
}
