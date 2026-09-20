import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/server/auth/session";
import { diasDesde, formatFolioContrato } from "@/lib/format";
import { estadoContratoInfo } from "@/lib/contrato-estado";
import { construirFiltroCartera, type CarteraSearchParams } from "@/lib/cartera-filtro";

function celdaCsv(valor: string): string {
  return `"${valor.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const usuario = await getCurrentUser();
  if (!usuario) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sp = Object.fromEntries(request.nextUrl.searchParams) as CarteraSearchParams;
  const { where, orderBy } = construirFiltroCartera(sp);

  const contratos = await prisma.contrato.findMany({
    where,
    orderBy,
    include: {
      cliente: { select: { nombreCompleto: true } },
      motocicleta: { select: { placa: true, marca: true, modelo: true } },
    },
  });

  const encabezados = [
    "Folio",
    "Cliente",
    "Motocicleta",
    "Saldo capital",
    "Mora acumulada",
    "Días del periodo actual",
    "Estado",
  ];
  const filas = contratos.map((c) =>
    [
      formatFolioContrato(c.folio),
      c.cliente.nombreCompleto,
      `${c.motocicleta.placa} — ${c.motocicleta.marca} ${c.motocicleta.modelo}`,
      c.saldoCapitalPendiente.toString(),
      c.moraAcumulada.toString(),
      diasDesde(c.fechaAperturaPeriodoActual).toString(),
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
