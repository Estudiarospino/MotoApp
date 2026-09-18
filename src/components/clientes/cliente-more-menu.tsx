"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Power } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function ClienteMoreMenu({ activo, onToggleActivo }: { activo: boolean; onToggleActivo: () => void | Promise<void> }) {
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
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Más acciones"
        className={buttonVariants({ variant: "outline", size: "icon" })}
      >
        <MoreHorizontal className="size-4" />
      </button>

      {abierto && (
        <div className="absolute right-0 z-40 mt-2 w-48 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-lg">
          <button
            type="button"
            onClick={() => {
              setAbierto(false);
              onToggleActivo();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm hover:bg-muted"
          >
            <Power className="size-4" />
            {activo ? "Desactivar cliente" : "Activar cliente"}
          </button>
        </div>
      )}
    </div>
  );
}
