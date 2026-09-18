"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Printer, RefreshCw } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";

export function ContratoHeaderActions() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [girando, setGirando] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setGirando(true);
          startTransition(() => router.refresh());
          setTimeout(() => setGirando(false), 600);
        }}
        disabled={pending}
        className={cn(buttonVariants({ variant: "outline" }), "print:hidden")}
      >
        <RefreshCw className={cn("size-4", girando && "animate-spin")} data-icon="inline-start" />
        Actualizar
      </button>
      <button type="button" onClick={() => window.print()} className={cn(buttonVariants({ variant: "outline" }), "print:hidden")}>
        <Printer data-icon="inline-start" className="size-4" />
        Imprimir
      </button>
    </>
  );
}
