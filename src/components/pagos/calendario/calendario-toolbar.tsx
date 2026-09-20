import Link from "next/link";
import { cn } from "cn";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCOP } from "@/lib/money";
import { buttonVariants } from "@/components/ui/button";
import { claveDia, inicioDeDia, sumarAnios, sumarDias, sumarMeses } from "@/server/calendario-pagos";

export type Vista = "semana" | "mes" | "anio";

const VISTA_OPCIONES: { value: Vista; label: string }[] = [
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mes" },
  { value: "anio", label: "Año" },
];

const formatoMesAnio = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" });
const formatoDiaMes = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "UTC" });

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function etiquetaPeriodo(vista: Vista, fecha: Date): string {
  if (vista === "mes") return capitalizar(formatoMesAnio.format(fecha));
  if (vista === "anio") return fecha.getUTCFullYear().toString();
  const inicio = sumarDias(fecha, -((fecha.getUTCDay() || 7) - 1));
  const fin = sumarDias(inicio, 6);
  return `${formatoDiaMes.format(inicio)} – ${formatoDiaMes.format(fin)} de ${fin.getUTCFullYear()}`;
}

function href(vista: Vista, fecha: Date): string {
  return `/pagos/calendario?vista=${vista}&fecha=${claveDia(fecha)}`;
}

function fechaAnterior(vista: Vista, fecha: Date): Date {
  if (vista === "mes") return sumarMeses(fecha, -1);
  if (vista === "anio") return sumarAnios(fecha, -1);
  return sumarDias(fecha, -7);
}

function fechaSiguiente(vista: Vista, fecha: Date): Date {
  if (vista === "mes") return sumarMeses(fecha, 1);
  if (vista === "anio") return sumarAnios(fecha, 1);
  return sumarDias(fecha, 7);
}

export function CalendarioToolbar({
  vista,
  fecha,
  totalRango,
  cantidadRango,
}: {
  vista: Vista;
  fecha: Date;
  totalRango: number;
  cantidadRango: number;
}) {
  const hoy = inicioDeDia(new Date());

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        {VISTA_OPCIONES.map((opcion) => (
          <Link
            key={opcion.value}
            href={href(opcion.value, fecha)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-sm font-medium whitespace-nowrap",
              vista === opcion.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input text-muted-foreground hover:text-foreground",
            )}
          >
            {opcion.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-center">
        <Link href={href(vista, fechaAnterior(vista, fecha))} aria-label="Periodo anterior" className={buttonVariants({ variant: "outline", size: "icon-sm" })}>
          <ChevronLeft className="size-4" />
        </Link>
        <p className="min-w-[180px] text-center text-sm font-semibold text-foreground">{etiquetaPeriodo(vista, fecha)}</p>
        <Link href={href(vista, fechaSiguiente(vista, fecha))} aria-label="Periodo siguiente" className={buttonVariants({ variant: "outline", size: "icon-sm" })}>
          <ChevronRight className="size-4" />
        </Link>
        <Link href={href(vista, hoy)} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Hoy
        </Link>
      </div>

      <div className="text-sm sm:text-right">
        <p className="text-xs text-muted-foreground">Cobrado en el periodo</p>
        <p className="font-semibold tabular-nums text-foreground">
          {formatCOP(totalRango)}{" "}
          <span className="font-normal text-muted-foreground">
            · {cantidadRango} pago{cantidadRango === 1 ? "" : "s"}
          </span>
        </p>
      </div>
    </div>
  );
}
