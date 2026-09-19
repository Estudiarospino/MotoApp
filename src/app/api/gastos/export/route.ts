import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/server/auth/session";
import { formatFecha } from "@/lib/format";
import { construirFiltroGastos, type GastosSearchParams } from "@/lib/gastos-filtro";

const CATEGORIA_LABEL: Record<string, string> = {
  MANTENIMIENTO: "Mantenimiento",
  REPARACION: "Reparación",
  SEGURO: "Seguro",
  IMPUESTOS: "Impuestos",
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

  const sp = Object.fromEntries(request.nextUrl.searchParams) as GastosSearchParams;
  const { where, orderBy } = construirFiltroGastos(sp);

  const gastos = await prisma.gasto.findMany({
    where,
    orderBy,
    include: { motocicleta: { select: { placa: true, marca: true, modelo: true } } },
  });

  const encabezados = ["Fecha", "Motocicleta", "Categoría", "Descripción", "Monto"];
  const filas = gastos.map((g) =>
    [
      formatFecha(g.fecha),
      `${g.motocicleta.placa} — ${g.motocicleta.marca} ${g.motocicleta.modelo}`,
      CATEGORIA_LABEL[g.categoria] ?? g.categoria,
      g.descripcion,
      g.monto.toString(),
    ]
      .map(celdaCsv)
      .join(","),
  );

  const csv = [encabezados.map(celdaCsv).join(","), ...filas].join("\n");

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gastos.csv"`,
    },
  });
}
