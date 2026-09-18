"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, FilterX, Search } from "lucide-react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ClientesFiltrosValor = {
  q: string;
  estado: string;
  contrato: string;
  orden: string;
};

const ESTADO_OPCIONES = [
  { value: "todos", label: "Todos" },
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
];

const CONTRATO_OPCIONES = [
  { value: "todos", label: "Todos" },
  { value: "con", label: "Con contrato activo" },
  { value: "sin", label: "Sin contrato activo" },
];

const ORDEN_OPCIONES = [
  { value: "reciente", label: "Más reciente" },
  { value: "antiguo", label: "Más antiguo" },
  { value: "nombre_asc", label: "Nombre (A-Z)" },
  { value: "nombre_desc", label: "Nombre (Z-A)" },
];

const CHIPS_MOVIL = [
  { key: "todos", label: "Todos", estado: "todos", contrato: "todos" },
  { key: "activos", label: "Activos", estado: "activo", contrato: "todos" },
  { key: "con_contrato", label: "Con contrato", estado: "todos", contrato: "con" },
  { key: "inactivos", label: "Inactivos", estado: "inactivo", contrato: "todos" },
] as const;

const VALORES_DEFECTO: ClientesFiltrosValor = { q: "", estado: "todos", contrato: "todos", orden: "reciente" };

export function ClientesFilters({ basePath, valores }: { basePath: string; valores: ClientesFiltrosValor }) {
  const router = useRouter();
  const [q, setQ] = useState(valores.q);
  const [masFiltrosMovil, setMasFiltrosMovil] = useState(false);
  const primerRender = useRef(true);

  function navegar(cambios: Partial<ClientesFiltrosValor>) {
    const siguiente = { ...valores, q, ...cambios };
    const params = new URLSearchParams();
    if (siguiente.q) params.set("q", siguiente.q);
    if (siguiente.estado !== "todos") params.set("estado", siguiente.estado);
    if (siguiente.contrato !== "todos") params.set("contrato", siguiente.contrato);
    if (siguiente.orden !== "reciente") params.set("orden", siguiente.orden);
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    const timeout = setTimeout(() => navegar({ q }), 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hayFiltrosActivos =
    valores.q !== "" || valores.estado !== "todos" || valores.contrato !== "todos" || valores.orden !== "reciente";

  return (
    <div className="flex flex-col gap-3">
      {/* Móvil: búsqueda + chips rápidos */}
      <div className="flex flex-col gap-3 sm:hidden">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar clientes..."
              className="pl-9"
            />
          </div>
          <button
            type="button"
            onClick={() => setMasFiltrosMovil((v) => !v)}
            aria-label="Más filtros"
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg border border-input",
              masFiltrosMovil && "border-ring bg-muted",
            )}
          >
            <Filter className="size-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {CHIPS_MOVIL.map((chip) => {
            const activo = valores.estado === chip.estado && valores.contrato === chip.contrato;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => navegar({ estado: chip.estado, contrato: chip.contrato })}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-sm font-medium whitespace-nowrap",
                  activo ? "border-primary bg-primary text-primary-foreground" : "border-input text-muted-foreground",
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {masFiltrosMovil && (
          <div className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-xs text-muted-foreground">Ordenar por</span>
              <Select value={valores.orden} onValueChange={(v) => navegar({ orden: v as string })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDEN_OPCIONES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!hayFiltrosActivos}
              onClick={() => {
                setQ(VALORES_DEFECTO.q);
                router.push(basePath);
              }}
              aria-label="Limpiar filtros"
            >
              <FilterX className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Escritorio: barra de filtros completa */}
      <div className="hidden flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative sm:min-w-[220px] sm:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, identificación o teléfono..."
            className="pl-9"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Estado</span>
          <Select value={valores.estado} onValueChange={(v) => navegar({ estado: v as string })}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADO_OPCIONES.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Con contrato</span>
          <Select value={valores.contrato} onValueChange={(v) => navegar({ contrato: v as string })}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTRATO_OPCIONES.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Ordenar por</span>
          <Select value={valores.orden} onValueChange={(v) => navegar({ orden: v as string })}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDEN_OPCIONES.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={!hayFiltrosActivos}
          onClick={() => {
            setQ(VALORES_DEFECTO.q);
            router.push(basePath);
          }}
          className="ml-auto"
        >
          <FilterX data-icon="inline-start" className="size-4" />
          Limpiar filtros
        </Button>
      </div>
    </div>
  );
}
