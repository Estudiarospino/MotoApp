"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRightLeft, Save, X } from "lucide-react";
import { formatCOP } from "@/lib/money";
import { formatFolioContrato } from "@/lib/format";
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
import { FRECUENCIAS_PAGO } from "@/lib/validation/contrato";
import type { ContratoFormState } from "./actions";

const ESTADO_INICIAL: ContratoFormState = {};

const FRECUENCIA_LABEL: Record<(typeof FRECUENCIAS_PAGO)[number], string> = {
  DIARIO: "Diario",
  SEMANAL: "Semanal",
  QUINCENAL: "Quincenal",
  MENSUAL: "Mensual",
};

function BotonGuardar({ renegociacion }: { renegociacion?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Save data-icon="inline-start" className="size-4" />
      {pending ? "Guardando..." : renegociacion ? "Crear contrato renegociado" : "Guardar"}
    </Button>
  );
}

/** Calcula fecha_inicio + N meses (YYYY-MM-DD). Solo informativo: no entra al motor de cierre. */
function sumarMeses(fechaInicioIso: string, mesesTexto: string): string {
  const meses = Number(mesesTexto);
  if (!fechaInicioIso || !mesesTexto || !Number.isInteger(meses) || meses <= 0) return "";
  const [anio, mes, dia] = fechaInicioIso.split("-").map(Number);
  if (!anio || !mes || !dia) return "";
  const fecha = new Date(Date.UTC(anio, mes - 1 + meses, dia));
  return fecha.toISOString().slice(0, 10);
}

type TerminosIniciales = {
  valorTotalContrato?: string;
  arriendoFijoMensual?: string;
  metaMensualReferencia?: string;
  cuotaDiariaReferencia?: string;
  frecuenciaPago?: string;
  fechaFinEstimada?: string;
};

export type RenegociacionInfo = {
  contratoAnteriorId: string;
  contratoAnteriorFolio: number;
  clienteId: string;
  clienteNombre: string;
  deudaPendiente: number;
};

type ContratoFormProps = {
  action: (state: ContratoFormState, formData: FormData) => Promise<ContratoFormState>;
  valoresIniciales?: TerminosIniciales;
} & (
  | {
      modo: "crear";
      clientes: { id: string; nombreCompleto: string; numeroIdentificacion: string }[];
      motos: { id: string; marca: string; modelo: string; placa: string; precioInicial: number }[];
      clienteIdInicial?: string;
      renegociacion?: RenegociacionInfo;
      onSuccess?: () => void;
      onCancel?: () => void;
    }
  | { modo: "editar" }
);

export function ContratoForm(props: ContratoFormProps) {
  const { action, valoresIniciales } = props;
  const [state, formAction] = useActionState(action, ESTADO_INICIAL);
  const renegociacion = props.modo === "crear" ? props.renegociacion : undefined;

  useEffect(() => {
    if (state.ok && props.modo === "crear") {
      props.onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const [fechaInicio, setFechaInicio] = useState("");
  const [plazoMeses, setPlazoMeses] = useState("");
  const [fechaFinEstimada, setFechaFinEstimada] = useState(valoresIniciales?.fechaFinEstimada ?? "");
  const [valorTotalContrato, setValorTotalContrato] = useState(valoresIniciales?.valorTotalContrato ?? "");
  const [precioMoto, setPrecioMoto] = useState(0);
  const [deudaTrasladada, setDeudaTrasladada] = useState(renegociacion?.deudaPendiente.toString() ?? "0");

  function recalcularValorTotal(precio: number, deudaTexto: string) {
    const deuda = Number(deudaTexto) || 0;
    setValorTotalContrato((precio + deuda).toString());
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      {renegociacion && (
        <div className="flex flex-col gap-2 rounded-lg border border-warning/30 bg-warning/[0.06] p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <ArrowRightLeft className="size-4 text-warning" />
            Renegociando {formatFolioContrato(renegociacion.contratoAnteriorFolio)} — {renegociacion.clienteNombre}
          </p>
          <p className="text-xs text-muted-foreground">
            Ese contrato quedó incumplido con {formatCOP(renegociacion.deudaPendiente)} pendientes (capital + mora).
            Ese contrato no cambia; este nuevo queda ligado a él para que la deuda trasladada sea trazable.
          </p>
          <input type="hidden" name="contratoAnteriorId" value={renegociacion.contratoAnteriorId} />
          <input type="hidden" name="clienteId" value={renegociacion.clienteId} />
        </div>
      )}

      {props.modo === "crear" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            {renegociacion ? (
              <div className="flex flex-col gap-1">
                <Label>Cliente</Label>
                <p className="flex h-8 items-center rounded-lg border border-input bg-muted/50 px-2.5 text-sm text-foreground">
                  {renegociacion.clienteNombre}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <Label htmlFor="clienteId">Cliente</Label>
                <Select name="clienteId" defaultValue={props.clienteIdInicial}>
                  <SelectTrigger id="clienteId" className="w-full">
                    <SelectValue placeholder="Selecciona un cliente">
                      {(v: string) => {
                        const cliente = props.clientes.find((c) => c.id === v);
                        return cliente ? `${cliente.nombreCompleto} — ${cliente.numeroIdentificacion}` : v;
                      }}
                    </SelectValue>
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
            )}

            <div className="flex flex-col gap-1">
              <Label htmlFor="motocicletaId">Motocicleta</Label>
              <Select
                name="motocicletaId"
                onValueChange={(v) => {
                  const moto = props.motos.find((m) => m.id === v);
                  if (!moto) return;
                  setPrecioMoto(moto.precioInicial);
                  if (renegociacion) {
                    recalcularValorTotal(moto.precioInicial, deudaTrasladada);
                  } else {
                    setValorTotalContrato(moto.precioInicial.toString());
                  }
                }}
              >
                <SelectTrigger id="motocicletaId" className="w-full">
                  <SelectValue placeholder="Selecciona una moto disponible">
                    {(v: string) => {
                      const moto = props.motos.find((m) => m.id === v);
                      return moto ? `${moto.placa} — ${moto.marca} ${moto.modelo}` : v;
                    }}
                  </SelectValue>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="fechaInicio">Fecha de inicio</Label>
              <Input
                id="fechaInicio"
                name="fechaInicio"
                type="date"
                required
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  const calculada = sumarMeses(e.target.value, plazoMeses);
                  if (calculada) setFechaFinEstimada(calculada);
                }}
              />
              <FormFieldError mensajes={state.fieldErrors?.fechaInicio} />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="plazoMeses">Plazo (meses)</Label>
              <Input
                id="plazoMeses"
                type="number"
                min={1}
                placeholder="Ej: 20"
                value={plazoMeses}
                onChange={(e) => {
                  setPlazoMeses(e.target.value);
                  const calculada = sumarMeses(fechaInicio, e.target.value);
                  if (calculada) setFechaFinEstimada(calculada);
                }}
              />
              <p className="text-xs text-muted-foreground">Calcula la fecha de fin abajo.</p>
            </div>
          </div>

          {renegociacion && (
            <div className="flex flex-col gap-1">
              <Label htmlFor="deudaTrasladada">Deuda a trasladar (COP)</Label>
              <Input
                id="deudaTrasladada"
                name="deudaTrasladada"
                type="number"
                min={0}
                value={deudaTrasladada}
                onChange={(e) => {
                  setDeudaTrasladada(e.target.value);
                  recalcularValorTotal(precioMoto, e.target.value);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Por defecto es la deuda completa del contrato anterior; bájala si se perdona una parte.
              </p>
              <FormFieldError mensajes={state.fieldErrors?.deudaTrasladada} />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <Label htmlFor="valorTotalContrato">Valor total del contrato (COP)</Label>
            <Input
              id="valorTotalContrato"
              name="valorTotalContrato"
              type="number"
              value={valorTotalContrato}
              onChange={(e) => setValorTotalContrato(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              {renegociacion
                ? "Precio de la moto + deuda trasladada; ajústalo si hace falta."
                : "Se autocompleta con el precio registrado de la moto; ajústalo si el valor pactado es distinto."}
            </p>
            <FormFieldError mensajes={state.fieldErrors?.valorTotalContrato} />
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="arriendoFijoMensual">Arriendo fijo mensual (COP)</Label>
          <Input
            id="arriendoFijoMensual"
            name="arriendoFijoMensual"
            type="number"
            defaultValue={valoresIniciales?.arriendoFijoMensual}
            required
          />
          <p className="text-xs text-muted-foreground">Lo que usa el motor de cierre para la meta del periodo.</p>
          <FormFieldError mensajes={state.fieldErrors?.arriendoFijoMensual} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="frecuenciaPago">Periodo de pago</Label>
          <Select name="frecuenciaPago" defaultValue={valoresIniciales?.frecuenciaPago ?? "MENSUAL"}>
            <SelectTrigger id="frecuenciaPago" className="w-full">
              <SelectValue>
                {(v: (typeof FRECUENCIAS_PAGO)[number]) => FRECUENCIA_LABEL[v] ?? v}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {FRECUENCIAS_PAGO.map((f) => (
                <SelectItem key={f} value={f}>
                  {FRECUENCIA_LABEL[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Solo informativo, no entra al cálculo.</p>
          <FormFieldError mensajes={state.fieldErrors?.frecuenciaPago} />
        </div>
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
          value={fechaFinEstimada}
          readOnly={props.modo === "crear"}
          onChange={props.modo === "crear" ? undefined : (e) => setFechaFinEstimada(e.target.value)}
          className={props.modo === "crear" ? "bg-muted/50 text-muted-foreground" : undefined}
        />
        {props.modo === "crear" && (
          <p className="text-xs text-muted-foreground">
            Se calcula sola con la fecha de inicio y el plazo en meses.
          </p>
        )}
        <FormFieldError mensajes={state.fieldErrors?.fechaFinEstimada} />
      </div>

      <div className="flex justify-end gap-2">
        {props.modo === "crear" && props.onCancel && (
          <Button type="button" variant="outline" onClick={props.onCancel}>
            <X data-icon="inline-start" className="size-4" />
            Cancelar
          </Button>
        )}
        <BotonGuardar renegociacion={!!renegociacion} />
      </div>
    </form>
  );
}
