import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/server/auth/session";
import { formatFecha, formatFolioContrato } from "@/lib/format";

const TIPO_LABEL: Record<string, string> = {
  ARRIENDO: "Arriendo",
  ABONO_CAPITAL: "Abono a capital",
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
        include: {
          periodoCierre: { select: { numeroPeriodo: true } },
          metodoPago: { select: { nombre: true } },
        },
      },
    },
  });

  if (!contrato) {
    return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
  }

  const encabezados = ["Fecha", "Tipo", "Monto", "Método", "Referencia", "Periodo", "Notas"];
  const filas = contrato.pagos.map((p) =>
    [
      formatFecha(p.fecha),
      TIPO_LABEL[p.tipo] ?? p.tipo,
      p.monto.toString(),
      p.metodoPago.nombre,
      p.referencia ?? "",
      p.tipo === "ABONO_CAPITAL" ? "—" : p.periodoCierre ? `Periodo ${p.periodoCierre.numeroPeriodo}` : "Abierto",
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
