"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteGasto } from "./actions";

export function EliminarGastoButton({ gastoId }: { gastoId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Eliminar este gasto? Esta acción no se puede deshacer.")) return;
    startTransition(async () => {
      await deleteGasto(gastoId);
      toast.success("Gasto eliminado.");
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label="Eliminar gasto"
      disabled={pending}
      onClick={handleClick}
      className="text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
