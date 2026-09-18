"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormFieldError } from "@/components/form-field-error";
import type { ContratoFormState } from "./actions";

const ESTADO_INICIAL: ContratoFormState = {};

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : "Guardar"}
    </Button>
  );
}

type TerminosIniciales = {
  valorTotalContrato?: string;
  arriendoFijoMensual?: string;
  metaMensualReferencia?: string;
  cuotaDiariaReferencia?: string;
  fechaFinEstimada?: string;
};

type ContratoFormProps = {
  action: (state: ContratoFormState, formData: FormData) => Promise<ContratoFormState>;
  valoresIniciales?: TerminosIniciales;
} & (
  | {
      modo: "crear";
      clientes: { id: string; nombreCompleto: string; numeroIdentificacion: string }[];
      motos: { id: string; marca: string; modelo: string; placa: string }[];
      clienteIdInicial?: string;
    }
  | { modo: "editar" }
);

export function ContratoForm(props: ContratoFormProps) {
  const { action, valoresIniciales } = props;
  const [state, formAction] = useActionState(action, ESTADO_INICIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      {props.modo === "crear" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="clienteId">Cliente</Label>
              <Select name="clienteId" defaultValue={props.clienteIdInicial}>
                <SelectTrigger id="clienteId" className="w-full">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {props.clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombreCompleto} — {cliente.numeroIdentificacion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormFieldError mensajes={state.fieldErrors?.clienteId} />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="motocicletaId">Motocicleta</Label>
              <Select name="motocicletaId">
                <SelectTrigger id="motocicletaId" className="w-full">
                  <SelectValue placeholder="Selecciona una moto disponible" />
                </SelectTrigger>
                <SelectContent>
                  {props.motos.map((moto) => (
                    <SelectItem key={moto.id} value={moto.id}>
                      {moto.placa} — {moto.marca} {moto.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormFieldError mensajes={state.fieldErrors?.motocicletaId} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="fechaInicio">Fecha de inicio</Label>
            <Input id="fechaInicio" name="fechaInicio" type="date" required />
            <FormFieldError mensajes={state.fieldErrors?.fechaInicio} />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="valorTotalContrato">Valor total del contrato (COP)</Label>
            <Input
              id="valorTotalContrato"
              name="valorTotalContrato"
              type="number"
              defaultValue={valoresIniciales?.valorTotalContrato}
              required
            />
            <FormFieldError mensajes={state.fieldErrors?.valorTotalContrato} />
          </div>
        </>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="arriendoFijoMensual">Arriendo fijo mensual (COP)</Label>
        <Input
          id="arriendoFijoMensual"
          name="arriendoFijoMensual"
          type="number"
          defaultValue={valoresIniciales?.arriendoFijoMensual}
          required
        />
        <p className="text-xs text-muted-foreground">
          Este valor es el que usa el motor de cierre para calcular la meta de cada periodo.
        </p>
        <FormFieldError mensajes={state.fieldErrors?.arriendoFijoMensual} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="metaMensualReferencia">Meta mensual estimada (COP)</Label>
          <Input
            id="metaMensualReferencia"
            name="metaMensualReferencia"
            type="number"
            defaultValue={valoresIniciales?.metaMensualReferencia}
          />
          <p className="text-xs text-muted-foreground">Solo informativo, no entra al cálculo.</p>
          <FormFieldError mensajes={state.fieldErrors?.metaMensualReferencia} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="cuotaDiariaReferencia">Cuota diaria estimada (COP)</Label>
          <Input
            id="cuotaDiariaReferencia"
            name="cuotaDiariaReferencia"
            type="number"
            defaultValue={valoresIniciales?.cuotaDiariaReferencia}
          />
          <p className="text-xs text-muted-foreground">Solo informativo, no entra al cálculo.</p>
          <FormFieldError mensajes={state.fieldErrors?.cuotaDiariaReferencia} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="fechaFinEstimada">Fecha de fin estimada</Label>
        <Input
          id="fechaFinEstimada"
          name="fechaFinEstimada"
          type="date"
          defaultValue={valoresIniciales?.fechaFinEstimada}
        />
        <FormFieldError mensajes={state.fieldErrors?.fechaFinEstimada} />
      </div>

      <div>
        <BotonGuardar />
      </div>
    </form>
  );
}
