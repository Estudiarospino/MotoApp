import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/server/auth/session";
import { formatFecha } from "@/lib/format";
import { construirFiltroPrestamos, type PrestamosSearchParams } from "@/lib/prestamos-filtro";

function celdaCsv(valor: string): string {
  return `"${valor.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const usuario = await getCurrentUser();
  if (!usuario) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sp = Object.fromEntries(request.nextUrl.searchParams) as PrestamosSearchParams;
  const { where, orderBy } = construirFiltroPrestamos(sp);

  const prestamos = await prisma.prestamo.findMany({
    where,
    orderBy,
    include: { cliente: { select: { nombreCompleto: true, numeroIdentificacion: true } } },
  });

  const encabezados = ["Fecha", "Cliente", "Identificación", "Monto original", "Saldo pendiente", "Estado", "Motivo"];
  const filas = prestamos.map((p) =>
    [
      formatFecha(p.fecha),
      p.cliente.nombreCompleto,
      p.cliente.numeroIdentificacion,
      p.montoOriginal.toString(),
      p.saldoPendiente.toString(),
      p.estado === "ACTIVO" ? "Activo" : "Pagado",
      p.motivo ?? "",
    ]
      .map(celdaCsv)
      .join(","),
  );

  const csv = [encabezados.map(celdaCsv).join(","), ...filas].join("\n");

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prestamos.csv"`,
    },
  });
}
