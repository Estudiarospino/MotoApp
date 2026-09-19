"use client";

import { Printer } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";

export function ImprimirButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={cn(buttonVariants({ variant: "outline" }), "print:hidden")}
    >
      <Printer data-icon="inline-start" className="size-4" />
      Imprimir
    </button>
  );
}
