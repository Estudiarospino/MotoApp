"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, FilterX, Search } from "lucide-react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ContratosFiltrosValor = {
  q: string;
  estado: string;
  marca: string;
  fechaCreacion: string;
};

const ESTADO_OPCIONES = [
  { value: "todos", label: "Todos" },
  { value: "al_dia", label: "Al día" },
  { value: "en_mora", label: "En mora" },
  { value: "incumplido", label: "Incumplido" },
  { value: "finalizado", label: "Finalizado" },
];

const FECHA_OPCIONES = [
  { value: "todas", label: "Todas" },
  { value: "este_mes", label: "Este mes" },
  { value: "mes_anterior", label: "Mes anterior" },
  { value: "este_anio", label: "Este año" },
];

const VALORES_DEFECTO: ContratosFiltrosValor = { q: "", estado: "todos", marca: "todas", fechaCreacion: "todas" };

export function ContratosFilters({
  basePath,
  valores,
  marcas,
}: {
  basePath: string;
  valores: ContratosFiltrosValor;
  marcas: string[];
}) {
  const router = useRouter();
  const [q, setQ] = useState(valores.q);
  const [masFiltrosMovil, setMasFiltrosMovil] = useState(false);
  const primerRender = useRef(true);

  const marcaOpciones = [{ value: "todas", label: "Todas" }, ...marcas.map((m) => ({ value: m, label: m }))];

  function navegar(cambios: Partial<ContratosFiltrosValor>) {
    const siguiente = { ...valores, q, ...cambios };
    const params = new URLSearchParams();
    if (siguiente.q) params.set("q", siguiente.q);
    if (siguiente.estado !== "todos") params.set("estado", siguiente.estado);
    if (siguiente.marca !== "todas") params.set("marca", siguiente.marca);
    if (siguiente.fechaCreacion !== "todas") params.set("fechaCreacion", siguiente.fechaCreacion);
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
    valores.q !== "" || valores.estado !== "todos" || valores.marca !== "todas" || valores.fechaCreacion !== "todas";

  return (
    <div className="flex flex-col gap-3">
      {/* Móvil: búsqueda + chips rápidos por estado */}
      <div className="flex flex-col gap-3 sm:hidden">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar contratos..."
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
          {ESTADO_OPCIONES.map((opcion) => {
            const activo = valores.estado === opcion.value;
            return (
              <button
                key={opcion.value}
                type="button"
                onClick={() => navegar({ estado: opcion.value })}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-sm font-medium whitespace-nowrap",
                  activo ? "border-primary bg-primary text-primary-foreground" : "border-input text-muted-foreground",
                )}
              >
                {opcion.label}
              </button>
            );
          })}
        </div>

        {masFiltrosMovil && (
          <div className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-xs text-muted-foreground">Marca</span>
              <Select value={valores.marca} onValueChange={(v) => navegar({ marca: v as string })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {marcaOpciones.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-xs text-muted-foreground">Fecha de creación</span>
              <Select value={valores.fechaCreacion} onValueChange={(v) => navegar({ fechaCreacion: v as string })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FECHA_OPCIONES.map((o) => (
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
        <div className="relative sm:min-w-[240px] sm:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por folio, cliente, placa o modelo..."
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
          <span className="text-xs text-muted-foreground">Marca</span>
          <Select value={valores.marca} onValueChange={(v) => navegar({ marca: v as string })}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {marcaOpciones.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Fecha de creación</span>
          <Select value={valores.fechaCreacion} onValueChange={(v) => navegar({ fechaCreacion: v as string })}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FECHA_OPCIONES.map((o) => (
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
