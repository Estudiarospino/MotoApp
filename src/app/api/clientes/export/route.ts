import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/server/auth/session";
import { construirFiltroClientes } from "@/lib/clientes-filtro";

function celdaCsv(valor: string): string {
  return `"${valor.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const usuario = await getCurrentUser();
  if (!usuario) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const searchParams = Object.fromEntries(new URL(request.url).searchParams);
  const { where } = construirFiltroClientes(searchParams);

  const clientes = await prisma.cliente.findMany({
    where,
    orderBy: { nombreCompleto: "asc" },
  });

  const encabezados = ["Nombre", "Tipo ID", "Identificación", "Teléfono", "Email", "Dirección", "Estado"];
  const filas = clientes.map((c) =>
    [
      c.nombreCompleto,
      c.tipoIdentificacion,
      c.numeroIdentificacion,
      c.telefono ?? "",
      c.email ?? "",
      c.direccion ?? "",
      c.activo ? "Activo" : "Inactivo",
    ]
      .map(celdaCsv)
      .join(","),
  );

  const csv = [encabezados.map(celdaCsv).join(","), ...filas].join("\n");

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clientes.csv"`,
    },
  });
}
