import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/server/auth/session";
import { formatFecha, formatFolioContrato } from "@/lib/format";
import { construirFiltroPagos, type PagosSearchParams } from "@/lib/pagos-filtro";

const METODO_LABEL: Record<string, string> = {
  TRANSFERENCIA: "Transferencia",
  EFECTIVO: "Efectivo",
  OTRO: "Otro",
};

function celdaCsv(valor: string): string {
  return `"${valor.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const usuario = await getCurrentUser();
  if (!usuario) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sp = Object.fromEntries(request.nextUrl.searchParams) as PagosSearchParams;
  const { where, orderBy } = construirFiltroPagos(sp);

  const pagos = await prisma.pago.findMany({
    where,
    orderBy,
    include: {
      contrato: { select: { folio: true, cliente: { select: { nombreCompleto: true } } } },
      periodoCierre: { select: { numeroPeriodo: true } },
    },
  });

  const encabezados = ["Fecha", "Contrato", "Cliente", "Método", "Monto", "Referencia", "Periodo", "Notas"];
  const filas = pagos.map((p) =>
    [
      formatFecha(p.fecha),
      formatFolioContrato(p.contrato.folio),
      p.contrato.cliente.nombreCompleto,
      METODO_LABEL[p.metodo] ?? p.metodo,
      p.monto.toString(),
      p.referencia ?? "",
      p.periodoCierre ? `Periodo ${p.periodoCierre.numeroPeriodo}` : "Abierto",
      p.notas ?? "",
    ]
      .map(celdaCsv)
      .join(","),
  );

  const csv = [encabezados.map(celdaCsv).join(","), ...filas].join("\n");

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pagos.csv"`,
    },
  });
}
