import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/server/auth/session";
import { formatFolioContrato } from "@/lib/format";
import { diasSinPagar, estadoContratoInfo } from "@/lib/contrato-estado";
import { construirFiltroCartera, filtrarAtrasoCriticoEnMemoria, type CarteraSearchParams } from "@/lib/cartera-filtro";

function celdaCsv(valor: string): string {
  return `"${valor.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const usuario = await getCurrentUser();
  if (!usuario) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sp = Object.fromEntries(request.nextUrl.searchParams) as CarteraSearchParams;
  const { where, orderBy, q, estado } = construirFiltroCartera(sp);

  const encontrados = await prisma.contrato.findMany({
    where,
    orderBy,
    include: {
      cliente: { select: { nombreCompleto: true } },
      motocicleta: { select: { placa: true, marca: true, modelo: true } },
      pagos: { orderBy: { fecha: "desc" }, take: 1, select: { fecha: true } },
    },
  });

  const contratos = estado === "atraso_critico" ? filtrarAtrasoCriticoEnMemoria(encontrados, { q, orden: "mora_desc" }) : encontrados;

  const encabezados = [
    "Folio",
    "Cliente",
    "Motocicleta",
    "Saldo capital",
    "Mora acumulada",
    "Días sin pagar",
    "Estado",
  ];
  const filas = contratos.map((c) =>
    [
      formatFolioContrato(c.folio),
      c.cliente.nombreCompleto,
      `${c.motocicleta.placa} — ${c.motocicleta.marca} ${c.motocicleta.modelo}`,
      c.saldoCapitalPendiente.toString(),
      c.moraAcumulada.toString(),
      diasSinPagar({ fechaInicio: c.fechaInicio, ultimoPagoFecha: c.pagos[0]?.fecha ?? null }).toString(),
      estadoContratoInfo(c).label,
    ]
      .map(celdaCsv)
      .join(","),
  );

  const csv = [encabezados.map(celdaCsv).join(","), ...filas].join("\n");

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cartera.csv"`,
    },
  });
}
