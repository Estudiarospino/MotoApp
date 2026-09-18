import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/server/auth/session";
import { formatFecha, formatFolioContrato } from "@/lib/format";

const METODO_LABEL: Record<string, string> = {
  TRANSFERENCIA: "Transferencia",
  EFECTIVO: "Efectivo",
  OTRO: "Otro",
};

function celdaCsv(valor: string): string {
  return `"${valor.replace(/"/g, '""')}"`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ contratoId: string }> }) {
  const usuario = await getCurrentUser();
  if (!usuario) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { contratoId } = await params;
  const contrato = await prisma.contrato.findUnique({
    where: { id: contratoId },
    select: {
      folio: true,
      pagos: {
        orderBy: { fecha: "desc" },
        include: { periodoCierre: { select: { numeroPeriodo: true } } },
      },
    },
  });

  if (!contrato) {
    return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
  }

  const encabezados = ["Fecha", "Monto", "Método", "Referencia", "Periodo", "Notas"];
  const filas = contrato.pagos.map((p) =>
    [
      formatFecha(p.fecha),
      p.monto.toString(),
      METODO_LABEL[p.metodo] ?? p.metodo,
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
      "Content-Disposition": `attachment; filename="pagos-${formatFolioContrato(contrato.folio)}.csv"`,
    },
  });
}
