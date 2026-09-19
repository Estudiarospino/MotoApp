"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FilterX, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIAS_GASTO } from "@/lib/validation/gasto";

export type GastosFiltrosValor = {
  q: string;
  fechaDesde: string;
  fechaHasta: string;
  categoria: string;
  motocicletaId: string;
  estado: string;
};

const CATEGORIA_LABEL: Record<(typeof CATEGORIAS_GASTO)[number], string> = {
  MANTENIMIENTO: "Mantenimiento",
  REPARACION: "Reparación",
  SEGURO: "Seguro",
  IMPUESTOS: "Impuestos",
  OTRO: "Otro",
};

const ESTADO_OPCIONES = [
  { value: "todos", label: "Todos" },
  { value: "con_comprobante", label: "Con comprobante" },
  { value: "sin_comprobante", label: "Sin comprobante" },
];

const VALORES_DEFECTO: GastosFiltrosValor = {
  q: "",
  fechaDesde: "",
  fechaHasta: "",
  categoria: "todas",
  motocicletaId: "todas",
  estado: "todos",
};

export function GastosFilters({
  basePath,
  valores,
  motos,
}: {
  basePath: string;
  valores: GastosFiltrosValor;
  motos: { id: string; placa: string; marca: string; modelo: string }[];
}) {
  const router = useRouter();
  const [q, setQ] = useState(valores.q);
  const primerRender = useRef(true);

  const categoriaOpciones = [
    { value: "todas", label: "Todas" },
    ...CATEGORIAS_GASTO.map((c) => ({ value: c, label: CATEGORIA_LABEL[c] })),
  ];
  const motoOpciones = [
    { value: "todas", label: "Todas" },
    ...motos.map((m) => ({ value: m.id, label: `${m.placa} — ${m.marca} ${m.modelo}` })),
  ];

  function navegar(cambios: Partial<GastosFiltrosValor>) {
    const siguiente = { ...valores, q, ...cambios };
    const params = new URLSearchParams();
    if (siguiente.q) params.set("q", siguiente.q);
    if (siguiente.fechaDesde) params.set("fechaDesde", siguiente.fechaDesde);
    if (siguiente.fechaHasta) params.set("fechaHasta", siguiente.fechaHasta);
    if (siguiente.categoria !== "todas") params.set("categoria", siguiente.categoria);
    if (siguiente.motocicletaId !== "todas") params.set("motocicletaId", siguiente.motocicletaId);
    if (siguiente.estado !== "todos") params.set("estado", siguiente.estado);
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
    valores.q !== "" ||
    valores.fechaDesde !== "" ||
    valores.fechaHasta !== "" ||
    valores.categoria !== "todas" ||
    valores.motocicletaId !== "todas" ||
    valores.estado !== "todos";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="flex flex-col gap-1 xl:col-span-1">
          <span className="text-xs text-muted-foreground">Buscar</span>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Descripción, placa, categoría..."
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Fecha desde</span>
          <Input
            type="date"
            value={valores.fechaDesde}
            onChange={(e) => navegar({ fechaDesde: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Fecha hasta</span>
          <Input
            type="date"
            value={valores.fechaHasta}
            onChange={(e) => navegar({ fechaHasta: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Categoría</span>
          <Select value={valores.categoria} onValueChange={(v) => navegar({ categoria: v as string })}>
            <SelectTrigger className="w-full">
              <SelectValue>{(v: string) => categoriaOpciones.find((o) => o.value === v)?.label ?? v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categoriaOpciones.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Motocicleta</span>
          <Select value={valores.motocicletaId} onValueChange={(v) => navegar({ motocicletaId: v as string })}>
            <SelectTrigger className="w-full">
              <SelectValue>{(v: string) => motoOpciones.find((o) => o.value === v)?.label ?? v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {motoOpciones.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
