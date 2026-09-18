import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/server/auth/session";
import { generarReciboPdf } from "@/server/pdf/reciboPdf";
import { formatFolioContrato } from "@/lib/format";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ periodoCierreId: string }> },
) {
  const usuario = await getCurrentUser();
  if (!usuario) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { periodoCierreId } = await params;
  const periodo = await prisma.periodoCierre.findUnique({
    where: { id: periodoCierreId },
    include: { contrato: { include: { cliente: true, motocicleta: true } } },
  });

  if (!periodo) {
    return NextResponse.json({ error: "Periodo no encontrado" }, { status: 404 });
  }

  const pdfBuffer = await generarReciboPdf({
    folio: periodo.contrato.folio,
    numeroPeriodo: periodo.numeroPeriodo,
    tipoCierre: periodo.tipoCierre,
    fechaAperturaPeriodo: periodo.fechaAperturaPeriodo,
    fechaCierre: periodo.fechaCierre,
    moraAnterior: periodo.moraAnterior,
    arriendoFijoUsado: periodo.arriendoFijoUsado,
    metaArriendo: periodo.metaArriendo,
    cobradoPeriodo: periodo.cobradoPeriodo,
    arriendoCubierto: periodo.arriendoCubierto,
    abonoCapital: periodo.abonoCapital,
    moraNueva: periodo.moraNueva,
    saldoCapitalAnterior: periodo.saldoCapitalAnterior,
    saldoCapitalNuevo: periodo.saldoCapitalNuevo,
    excedenteNoAplicado: periodo.excedenteNoAplicado,
    contratoFinalizado: periodo.contratoFinalizado,
    cliente: periodo.contrato.cliente,
    motocicleta: periodo.contrato.motocicleta,
  });

  const nombreArchivo = `recibo-${formatFolioContrato(periodo.contrato.folio)}-periodo-${periodo.numeroPeriodo}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nombreArchivo}"`,
    },
  });
}
