"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { EditarContratoDialog } from "@/components/contratos/editar-contrato-dialog";

export function ContratoMoreMenu({
  contratoId,
  valoresIniciales,
}: {
  contratoId: string;
  valoresIniciales: {
    arriendoFijoMensual: string;
    metaMensualReferencia?: string;
    cuotaDiariaReferencia?: string;
    fechaFinEstimada?: string;
  };
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  return (
    <div className="relative print:hidden" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Más acciones"
        className={buttonVariants({ variant: "outline", size: "icon" })}
      >
        <MoreHorizontal className="size-4" />
      </button>

      <div
        className={cn(
          "absolute right-0 z-40 mt-2 w-52 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-lg",
          !abierto && "hidden",
        )}
      >
        <EditarContratoDialog
          contratoId={contratoId}
          valoresIniciales={valoresIniciales}
          trigger={
            <DialogTrigger
              onClick={() => setAbierto(false)}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-foreground hover:bg-muted"
            >
              <Pencil className="size-4" />
              Editar contrato
            </DialogTrigger>
          }
        />
      </div>
    </div>
  );
}
