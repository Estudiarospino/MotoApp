"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRightLeft, FilePlus2, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ContratoForm, type RenegociacionInfo } from "./contrato-form";
import { createContrato, crearContratoRenegociado } from "./actions";

export function ContratoDialog({
  defaultOpen = false,
  clientes,
  motos,
  clienteIdInicial,
  renegociacion,
  renegociacionError,
}: {
  defaultOpen?: boolean;
  clientes: { id: string; nombreCompleto: string; numeroIdentificacion: string }[];
  motos: { id: string; marca: string; modelo: string; placa: string; precioInicial: number }[];
  clienteIdInicial?: string;
  renegociacion?: RenegociacionInfo;
  renegociacionError?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const sinDatos = clientes.length === 0 || motos.length === 0;
  const Icon = renegociacion ? ArrowRightLeft : FilePlus2;
  const titulo = renegociacion ? "Renegociar contrato" : "Nuevo contrato";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants()}>
        <Plus data-icon="inline-start" className="size-4" />
        Nuevo contrato
      </DialogTrigger>
      <DialogContent>
        <div className="flex items-start gap-3 pr-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-semibold text-foreground">{titulo}</h2>
            <p className="text-sm text-muted-foreground">
              Define los términos del arrendamiento con opción de compra.
            </p>
          </div>
        </div>

        {renegociacionError ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{renegociacionError}</p>
        ) : sinDatos ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {clientes.length === 0 && "No hay clientes activos registrados. "}
              {motos.length === 0 && "No hay motos disponibles para asignar. "}
              Registra los datos necesarios antes de crear un contrato.
            </p>
            <div className="flex gap-2">
              <Link href="/clientes?nuevo=1" className={buttonVariants({ variant: "outline" })}>
                Nuevo cliente
              </Link>
              <Link href="/motos?nuevo=1" className={buttonVariants({ variant: "outline" })}>
                Nueva moto
              </Link>
            </div>
          </div>
        ) : (
          <ContratoForm
            modo="crear"
            action={renegociacion ? crearContratoRenegociado : createContrato}
            clientes={clientes}
            motos={motos}
            clienteIdInicial={clienteIdInicial}
            renegociacion={renegociacion}
            onSuccess={() => {
              toast.success("Contrato creado.");
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
