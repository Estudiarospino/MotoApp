"use client";

import { MoreHorizontal } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { AbonoDialog } from "./abono-dialog";

export function PrestamoMoreMenu({
  prestamoId,
  activo,
  metodosPago,
}: {
  prestamoId: string;
  activo: boolean;
  metodosPago: { id: string; nombre: string }[];
}) {
  if (!activo) {
    return (
      <button
        type="button"
        disabled
        title="Este préstamo ya está pagado."
        aria-label="Más acciones"
        className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "cursor-not-allowed opacity-40")}
      >
        <MoreHorizontal className="size-4" />
      </button>
    );
  }

  return (
    <AbonoDialog
      prestamoId={prestamoId}
      metodosPago={metodosPago}
      trigger={
        <DialogTrigger aria-label="Más acciones" className={buttonVariants({ variant: "outline", size: "icon-sm" })}>
          <MoreHorizontal className="size-4" />
        </DialogTrigger>
      }
    />
  );
}
