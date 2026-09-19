"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRightLeft, ChevronDown, StickyNote } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { NotaDialog } from "./nota-dialog";
import { TransferenciaDialog } from "./transferencia-dialog";

export function PrestamoMasAccionesMenu({
  prestamoId,
  transferencia,
}: {
  prestamoId: string;
  transferencia?: {
    saldoPendiente: number;
    contratos: { id: string; folio: number }[];
    contratoIdInicial?: string;
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
      <button type="button" onClick={() => setAbierto((v) => !v)} className={buttonVariants({ variant: "outline" })}>
        Más acciones
        <ChevronDown data-icon="inline-end" className="size-4" />
      </button>

      {/* Los Dialog quedan siempre montados (solo se oculta el contenedor con CSS): si el menú se
          desmontara al cerrarse, el Dialog perdería su estado justo al hacer clic en un ítem. */}
      <div
        className={cn(
          "absolute right-0 z-40 mt-2 w-56 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-lg",
          !abierto && "hidden",
        )}
      >
        {transferencia && transferencia.contratos.length > 0 && (
          <TransferenciaDialog
            prestamoId={prestamoId}
            saldoPendiente={transferencia.saldoPendiente}
            contratos={transferencia.contratos}
            contratoIdInicial={transferencia.contratoIdInicial}
            trigger={
              <DialogTrigger
                onClick={() => setAbierto(false)}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm hover:bg-muted"
              >
                <ArrowRightLeft className="size-4" />
                Transferir a capital
              </DialogTrigger>
            }
          />
        )}
        <NotaDialog
          prestamoId={prestamoId}
          trigger={
            <DialogTrigger
              onClick={() => setAbierto(false)}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm hover:bg-muted"
            >
              <StickyNote className="size-4" />
              Agregar nota
            </DialogTrigger>
          }
        />
      </div>
    </div>
  );
}
