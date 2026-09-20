import { PageHeader } from "@/components/page-header";
import { CalendarioToolbar, type Vista } from "@/components/pagos/calendario/calendario-toolbar";
import { VistaMes } from "@/components/pagos/calendario/vista-mes";
import { VistaSemana } from "@/components/pagos/calendario/vista-semana";
import { VistaAnio } from "@/components/pagos/calendario/vista-anio";
import {
  getPagosDelRango,
  getResumenAnual,
  inicioDeDia,
  inicioDeMes,
  rangoMes,
  rangoSemana,
  sumarMeses,
  type PagoCalendario,
} from "@/server/calendario-pagos";

type CalendarioSearchParams = { vista?: string; fecha?: string };

function parseFecha(valor?: string): Date {
  if (valor && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [anio, mes, dia] = valor.split("-").map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    if (!Number.isNaN(fecha.getTime())) return fecha;
  }
  return inicioDeDia(new Date());
}

function parseVista(valor?: string): Vista {
  return valor === "semana" || valor === "anio" ? valor : "mes";
}

export default async function CalendarioPagosPage({
  searchParams,
}: {
  searchParams: Promise<CalendarioSearchParams>;
}) {
  const sp = await searchParams;
  const vista = parseVista(sp.vista);
  const fecha = parseFecha(sp.fecha);

  let totalRango = 0;
  let cantidadRango = 0;
  let contenido: React.ReactNode;

  if (vista === "anio") {
    const resumenMeses = await getResumenAnual(fecha.getUTCFullYear());
    totalRango = resumenMeses.reduce((acc, m) => acc + m.total, 0);
    cantidadRango = resumenMeses.reduce((acc, m) => acc + m.cantidad, 0);
    contenido = <VistaAnio anio={fecha.getUTCFullYear()} resumenMeses={resumenMeses} />;
  } else if (vista === "semana") {
    const { desde, hasta } = rangoSemana(fecha);
    const pagosPorDia = await getPagosDelRango(desde, hasta);
    const lista = [...pagosPorDia.values()].flat();
    totalRango = lista.reduce((acc, p) => acc + p.monto, 0);
    cantidadRango = lista.length;
    contenido = <VistaSemana fecha={fecha} pagosPorDia={pagosPorDia} />;
  } else {
    const { desde, hasta } = rangoMes(fecha);
    const pagosPorDia = await getPagosDelRango(desde, hasta);

    // El total del encabezado es solo del mes exacto, sin los días de relleno de meses vecinos.
    const inicioMes = inicioDeMes(fecha);
    const finMesExclusivo = sumarMeses(inicioMes, 1);
    const listaDelMes: PagoCalendario[] = [];
    for (const pagosDia of pagosPorDia.values()) {
      for (const pago of pagosDia) {
        const fechaPago = inicioDeDia(pago.fecha);
        if (fechaPago >= inicioMes && fechaPago < finMesExclusivo) listaDelMes.push(pago);
      }
    }
    totalRango = listaDelMes.reduce((acc, p) => acc + p.monto, 0);
    cantidadRango = listaDelMes.length;
    contenido = <VistaMes fecha={fecha} pagosPorDia={pagosPorDia} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[
          { label: "Inicio", href: "/" },
          { label: "Pagos y recibos", href: "/pagos" },
          { label: "Calendario" },
        ]}
        title="Calendario de pagos"
        subtitle="Quién pagó, cuánto y cuándo — por semana, mes o año."
      />

      <CalendarioToolbar vista={vista} fecha={fecha} totalRango={totalRango} cantidadRango={cantidadRango} />

      {contenido}
    </div>
  );
}
