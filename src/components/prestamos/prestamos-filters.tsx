"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FilterX, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type PrestamosFiltrosValor = {
  q: string;
  estado: string;
  fechaDesde: string;
  fechaHasta: string;
};

const ESTADO_OPCIONES = [
  { value: "todos", label: "Todos" },
  { value: "activo", label: "Activo" },
  { value: "pagado", label: "Pagado" },
];

const VALORES_DEFECTO: PrestamosFiltrosValor = { q: "", estado: "todos", fechaDesde: "", fechaHasta: "" };

export function PrestamosFilters({ basePath, valores }: { basePath: string; valores: PrestamosFiltrosValor }) {
  const router = useRouter();
  const [q, setQ] = useState(valores.q);
  const primerRender = useRef(true);

  function navegar(cambios: Partial<PrestamosFiltrosValor>) {
    const siguiente = { ...valores, q, ...cambios };
    const params = new URLSearchParams();
    if (siguiente.q) params.set("q", siguiente.q);
    if (siguiente.estado !== "todos") params.set("estado", siguiente.estado);
    if (siguiente.fechaDesde) params.set("fechaDesde", siguiente.fechaDesde);
    if (siguiente.fechaHasta) params.set("fechaHasta", siguiente.fechaHasta);
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
    valores.q !== "" || valores.estado !== "todos" || valores.fechaDesde !== "" || valores.fechaHasta !== "";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Buscar</span>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nombre del cliente..."
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Estado</span>
          <Select value={valores.estado} onValueChange={(v) => navegar({ estado: v as string })}>
            <SelectTrigger className="w-full">
              <SelectValue>{(v: string) => ESTADO_OPCIONES.find((o) => o.value === v)?.label ?? v}</SelectValue>
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
          <span className="text-xs text-muted-foreground">Fecha desde</span>
          <Input type="date" value={valores.fechaDesde} onChange={(e) => navegar({ fechaDesde: e.target.value })} />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Fecha hasta</span>
          <Input type="date" value={valores.fechaHasta} onChange={(e) => navegar({ fechaHasta: e.target.value })} />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={!hayFiltrosActivos}
        onClick={() => {
          setQ(VALORES_DEFECTO.q);
          router.push(basePath);
        }}
        className="self-end"
      >
        <FilterX data-icon="inline-start" className="size-4" />
        Limpiar filtros
      </Button>
    </div>
  );
}
