import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRightLeft,
  BadgeDollarSign,
  Bike,
  Calendar,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  FileText,
  HandCoins,
  IdCard,
  Landmark,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Repeat,
  ShieldAlert,
  User,
  Wrench,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCOP, sumarPesos } from "@/lib/money";
import { diasDesde, formatFecha, formatFechaLarga, formatFolioContrato, toFechaInputValue } from "@/lib/format";
import { estadoContratoInfo } from "@/lib/contrato-estado";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DialogTrigger } from "@/components/ui/dialog";
import { MobilePageHeader } from "@/components/dashboard/mobile-page-header";
import { ContratoHeaderActions } from "@/components/contratos/contrato-header-actions";
import { ContratoMoreMenu } from "@/components/contratos/contrato-more-menu";
import { RegistrarPagoDialog } from "@/components/contratos/registrar-pago-dialog";
import { CerrarPeriodoDialog } from "@/components/contratos/cerrar-periodo-dialog";
import { AccionesRapidas } from "@/components/contratos/acciones-rapidas";
import { TabHistorialPagos } from "@/components/contratos/tab-historial-pagos";
import { TabPeriodos } from "@/components/contratos/tab-periodos";
import { TabResumenFinanciero } from "@/components/contratos/tab-resumen-financiero";
import { TabDocumentos } from "@/components/contratos/tab-documentos";
import { TabNotas } from "@/components/contratos/tab-notas";

const CATEGORIA_GASTO_LABEL = {
  MANTENIMIENTO: "Mantenimiento",
  REPARACION: "Reparación",
  SEGURO: "Seguro",
  IMPUESTOS: "Impuestos",
  OTRO: "Otro",
} as const;

const FRECUENCIA_LABEL: Record<string, string> = {
  DIARIO: "Diario",
  SEMANAL: "Semanal",
  QUINCENAL: "Quincenal",
  MENSUAL: "Mensual",
};

const formatoMesAnio = new Intl.DateTimeFormat("es-CO", { month: "short", year: "numeric", timeZone: "UTC" });
function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
function telefonoLimpio(telefono: string): string {
  return telefono.replace(/\D/g, "");
}

export default async function ContratoDetallePage({
  params,
}: {
  params: Promise<{ contratoId: string }>;
}) {
  const { contratoId } = await params;
  const contrato = await prisma.contrato.findUnique({
    where: { id: contratoId },
    include: {
      cliente: {
        select: { id: true, nombreCompleto: true, numeroIdentificacion: true, telefono: true, direccion: true },
      },
      motocicleta: {
        select: { id: true, placa: true, marca: true, modelo: true, anioModelo: true, color: true, fotoUrl: true },
      },
      pagos: {
        orderBy: { fecha: "desc" },
        include: {
          periodoCierre: {
            select: { numeroPeriodo: true, arriendoCubierto: true, abonoCapital: true, moraNueva: true },
          },
          metodoPago: { select: { nombre: true } },
          _count: { select: { notasCorreccion: true } },
        },
      },
      periodosCierre: { orderBy: { numeroPeriodo: "desc" } },
      documentos: { orderBy: { createdAt: "desc" } },
      notas: {
        orderBy: { createdAt: "desc" },
        include: { pago: { select: { id: true, fecha: true, monto: true } } },
      },
      transferenciasCapital: {
        orderBy: { fecha: "desc" },
        include: { prestamo: { select: { id: true, motivo: true } } },
      },
      renegociacionComoAnterior: { include: { contratoNuevo: { select: { id: true, folio: true } } } },
      renegociacionComoNuevo: { include: { contratoAnterior: { select: { id: true, folio: true } } } },
    },
  });

  if (!contrato) {
    notFound();
  }

  const [gastosMoto, prestamosCliente, metodosPago] = await Promise.all([
    prisma.gasto.findMany({ where: { motocicletaId: contrato.motocicletaId }, orderBy: { fecha: "desc" } }),
    prisma.prestamo.findMany({ where: { clienteId: contrato.clienteId }, orderBy: { fecha: "desc" } }),
    prisma.metodoPago.findMany({ where: { activo: true }, orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
  ]);

  const valoresInicialesTerminos = {
    arriendoFijoMensual: contrato.arriendoFijoMensual.toString(),
    metaMensualReferencia: contrato.metaMensualReferencia?.toString(),
    cuotaDiariaReferencia: contrato.cuotaDiariaReferencia?.toString(),
    frecuenciaPago: contrato.frecuenciaPago,
    fechaFinEstimada: contrato.fechaFinEstimada ? toFechaInputValue(contrato.fechaFinEstimada) : undefined,
  };
  const pagosAbiertos = contrato.pagos.filter((p) => p.periodoCierreId === null && p.tipo === "ARRIENDO");
  const cobradoPeriodo = sumarPesos(...pagosAbiertos.map((p) => p.monto));
  const abonosCapitalDirectos = contrato.pagos.filter((p) => p.tipo === "ABONO_CAPITAL");

  const pagosPorPeriodo = new Map<string, { id: string; fecha: Date; monto: number; metodoNombre: string }[]>();
  for (const pago of contrato.pagos) {
    if (!pago.periodoCierreId) continue;
    const lista = pagosPorPeriodo.get(pago.periodoCierreId) ?? [];
    lista.push({ id: pago.id, fecha: pago.fecha, monto: pago.monto, metodoNombre: pago.metodoPago.nombre });
    pagosPorPeriodo.set(pago.periodoCierreId, lista);
  }
  const metaArriendo = sumarPesos(contrato.arriendoFijoMensual, contrato.moraAcumulada);
  const pctCobrado = metaArriendo > 0 ? Math.min(100, Math.round((cobradoPeriodo / metaArriendo) * 100)) : 0;
  const faltaPorPagar = Math.max(metaArriendo - cobradoPeriodo, 0);
  const diasPeriodoAbierto = diasDesde(contrato.fechaAperturaPeriodoActual);
  const activo = contrato.estado === "ACTIVO";
  const estado = estadoContratoInfo(contrato);

  const abonadoCapital = sumarPesos(contrato.valorTotalContrato, -contrato.saldoCapitalPendiente);
  const progresoCompra =
    contrato.valorTotalContrato > 0 ? Math.round((abonadoCapital / contrato.valorTotalContrato) * 100) : 0;

  const totalRecaudadoHistorico = sumarPesos(
    ...contrato.periodosCierre.map((p) => p.cobradoPeriodo),
    cobradoPeriodo,
    ...abonosCapitalDirectos.map((p) => p.monto),
  );
  const totalAbonadoCapitalHistorico = sumarPesos(
    ...contrato.periodosCierre.map((p) => p.abonoCapital),
    ...abonosCapitalDirectos.map((p) => p.monto),
  );
  const ultimoPeriodoCerrado = contrato.periodosCierre[0];

  return (
    <div className="flex flex-col gap-6">
      <MobilePageHeader title={formatFolioContrato(contrato.folio)} backHref="/contratos" />

      <nav className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
        <Link href="/contratos" className="hover:text-foreground">
          Contratos
        </Link>
        <ChevronRight className="size-3" />
        <span className="font-medium text-foreground">{formatFolioContrato(contrato.folio)}</span>
      </nav>

      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Contrato {formatFolioContrato(contrato.folio)}
            </h1>
            <Badge variant={estado.variant}>{estado.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Arrendamiento con opción de compra</p>
          {contrato.renegociacionComoNuevo && (
            <Link
              href={`/contratos/${contrato.renegociacionComoNuevo.contratoAnterior.id}`}
              className="mt-1 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <ArrowRightLeft className="size-3.5" />
              Viene de renegociar {formatFolioContrato(contrato.renegociacionComoNuevo.contratoAnterior.folio)}
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ContratoHeaderActions />
          {activo && (
            <>
              <RegistrarPagoDialog
                contratoId={contrato.id}
                saldoCapitalPendiente={contrato.saldoCapitalPendiente}
                metodosPago={metodosPago}
                trigger={
                  <DialogTrigger className={buttonVariants({ className: "print:hidden" })}>
                    <Plus data-icon="inline-start" className="size-4" />
                    Registrar pago
                  </DialogTrigger>
                }
              />
              <ContratoMoreMenu contratoId={contrato.id} valoresIniciales={valoresInicialesTerminos} />
            </>
          )}
        </div>
      </div>

      {/* Cliente / Motocicleta / Información del contrato */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.08fr)_minmax(0,1.28fr)]">
        <Card className="min-h-[248px] border-primary/10 bg-card shadow-[0_10px_30px_-24px_rgba(22,35,61,0.45)]">
          <CardContent className="flex h-full flex-col">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <User className="size-6 stroke-[2.25]" />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground">CLIENTE</p>
                <p className="mt-1 truncate text-base font-semibold text-foreground">{contrato.cliente.nombreCompleto}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">CC {contrato.cliente.numeroIdentificacion}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2.5 text-sm">
              {contrato.cliente.telefono && (
                <>
                  <a href={`tel:${contrato.cliente.telefono}`} className="flex items-center gap-2.5 text-foreground transition-colors hover:text-primary">
                    <Phone className="size-4 text-primary" />
                    {contrato.cliente.telefono}
                  </a>
                  <a
                    href={`https://wa.me/57${telefonoLimpio(contrato.cliente.telefono)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 text-foreground transition-colors hover:text-success"
                  >
                    <MessageCircle className="size-4 text-success" />
                    {contrato.cliente.telefono}
                  </a>
                </>
              )}
              {contrato.cliente.direccion && (
                <p className="flex items-start gap-2.5 leading-snug text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  {contrato.cliente.direccion}
                </p>
              )}
            </div>
            <Link
              href={`/clientes/${contrato.cliente.id}`}
              className="mt-auto flex h-10 items-center justify-center gap-1.5 rounded-lg border border-primary/25 bg-primary/[0.025] text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              Ver perfil del cliente
              <ChevronRight className="size-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="min-h-[248px] border-primary/10 bg-card shadow-[0_10px_30px_-24px_rgba(22,35,61,0.45)]">
          <CardContent className="flex h-full flex-col">
            <div className="flex gap-4">
              <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/10 bg-primary/[0.045] sm:size-28">
                {contrato.motocicleta.fotoUrl ? (
                  <Image src={contrato.motocicleta.fotoUrl} alt={contrato.motocicleta.placa} fill className="object-cover" />
                ) : (
                  <Bike className="size-10 text-primary/60" />
                )}
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground">MOTOCICLETA</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {contrato.motocicleta.marca} {contrato.motocicleta.modelo}
                </p>
                <dl className="mt-3 space-y-1 text-sm">
                  <MotoDato etiqueta="Placa" valor={contrato.motocicleta.placa} />
                  <MotoDato etiqueta="Marca" valor={contrato.motocicleta.marca} />
                  <MotoDato etiqueta="Modelo" valor={contrato.motocicleta.modelo} />
                  {contrato.motocicleta.anioModelo && <MotoDato etiqueta="Año" valor={contrato.motocicleta.anioModelo.toString()} />}
                  {contrato.motocicleta.color && <MotoDato etiqueta="Color" valor={contrato.motocicleta.color} />}
                </dl>
              </div>
            </div>
            <Link
              href={`/motos/${contrato.motocicleta.id}`}
              className="mt-auto flex h-10 items-center justify-center gap-1.5 rounded-lg border border-primary/25 bg-primary/[0.025] text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              Ver ficha de la moto
              <ChevronRight className="size-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="min-h-[248px] border-primary/10 bg-card shadow-[0_10px_30px_-24px_rgba(22,35,61,0.45)]">
          <CardContent className="flex h-full flex-col">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="size-5 stroke-[2.25]" />
              </span>
              <div>
                <p className="text-base font-semibold text-foreground">Información del contrato</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Términos y estado actual</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-1">
              <CampoIcono icono={CalendarDays} etiqueta="Fecha de inicio" valor={formatFechaLarga(contrato.fechaInicio)} />
              <CampoIcono icono={BadgeDollarSign} etiqueta="Precio de la moto" valor={formatCOP(contrato.valorTotalContrato)} />
              <CampoIcono icono={Landmark} etiqueta="Arriendo por periodo" valor={formatCOP(contrato.arriendoFijoMensual)} />
              <CampoIcono
                icono={Repeat}
                etiqueta="Periodo de pago"
                valor={FRECUENCIA_LABEL[contrato.frecuenciaPago] ?? contrato.frecuenciaPago}
              />
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2.5 text-muted-foreground">
                  <IdCard className="size-4 text-primary" />
                  Estado
                </span>
                <Badge variant={estado.variant}>{estado.label}</Badge>
              </div>
              <CampoIcono
                icono={CalendarCheck}
                etiqueta="Periodos abiertos"
                valor={activo ? `1 (${diasPeriodoAbierto} día${diasPeriodoAbierto === 1 ? "" : "s"})` : "0"}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado financiero / Último periodo / Alerta de mora */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.48fr)_minmax(0,0.88fr)_minmax(0,0.82fr)]">
        <Card className="min-h-[228px] border-primary/10 bg-card shadow-[0_10px_30px_-24px_rgba(22,35,61,0.45)]">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-3 text-base">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-5 stroke-[2.25]" />
              </span>
              Estado financiero
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">Progreso de compra</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{progresoCompra}%</span>
              </div>
              <Progress value={progresoCompra}>
                <ProgressTrack className="h-2.5">
                  <ProgressIndicator />
                </ProgressTrack>
              </Progress>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <MiniStat etiqueta="Precio de la moto" valor={formatCOP(contrato.valorTotalContrato)} />
              <MiniStat etiqueta="Abonado a capital" valor={formatCOP(abonadoCapital)} tono="success" sub={`${progresoCompra}%`} />
              <MiniStat
                etiqueta="Saldo pendiente"
                valor={formatCOP(contrato.saldoCapitalPendiente)}
                sub={`${100 - progresoCompra}%`}
              />
              <MiniStat
                etiqueta="Mora actual"
                valor={formatCOP(contrato.moraAcumulada)}
                tono={contrato.moraAcumulada > 0 ? "warning" : "success"}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[228px] border-primary/10 bg-card shadow-[0_10px_30px_-24px_rgba(22,35,61,0.45)]">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-3 text-base">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Calendar className="size-5 stroke-[2.25]" />
              </span>
              {activo ? "Último periodo" : "Último estado"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {activo ? (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <Campo etiqueta="Periodo actual" valor={capitalizar(formatoMesAnio.format(contrato.fechaAperturaPeriodoActual))} />
                  <Campo etiqueta="Arriendo del periodo" valor={formatCOP(contrato.arriendoFijoMensual)} />
                  <Campo etiqueta="Pagado" valor={formatCOP(cobradoPeriodo)} />
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Falta por pagar</span>
                    <span className={`font-medium tabular-nums ${faltaPorPagar > 0 ? "text-warning" : "text-success"}`}>
                      {formatCOP(faltaPorPagar)}
                    </span>
                  </div>
                </div>
                <Progress value={pctCobrado}>
                  <ProgressTrack>
                    <ProgressIndicator />
                  </ProgressTrack>
                </Progress>
                <CerrarPeriodoDialog
                  contratoId={contrato.id}
                  arriendoFijoMensual={contrato.arriendoFijoMensual}
                  moraAcumulada={contrato.moraAcumulada}
                  cobradoPeriodo={cobradoPeriodo}
                  saldoCapitalPendiente={contrato.saldoCapitalPendiente}
                  trigger={
                    <DialogTrigger className="mt-auto flex h-10 items-center justify-center gap-1.5 rounded-lg border border-primary/25 bg-primary/[0.04] text-sm font-semibold text-primary transition-colors hover:bg-primary/10 print:hidden">
                      Cerrar periodo
                      <ChevronRight className="size-4" />
                    </DialogTrigger>
                  }
                />
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  {contrato.finalizadoAt ? `Finalizado el ${formatFechaLarga(contrato.finalizadoAt)}.` : "Este contrato ya no está activo."}
                </p>

                {contrato.estado === "INCUMPLIDO_RECUPERADA" &&
                  (contrato.renegociacionComoAnterior ? (
                    <Link
                      href={`/contratos/${contrato.renegociacionComoAnterior.contratoNuevo.id}`}
                      className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <ArrowRightLeft className="size-3.5" />
                      Renegociado en {formatFolioContrato(contrato.renegociacionComoAnterior.contratoNuevo.folio)}
                    </Link>
                  ) : (
                    <Link
                      href={`/contratos/nuevo?renegociarDe=${contrato.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm", className: "print:hidden" })}
                    >
                      <ArrowRightLeft data-icon="inline-start" className="size-4" />
                      Renegociar contrato
                    </Link>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {contrato.moraAcumulada > 0 ? (
          <Card className="min-h-[228px] border-destructive/20 bg-destructive/[0.045] shadow-[0_10px_30px_-24px_rgba(127,29,29,0.35)]">
            <CardContent className="flex h-full flex-col">
              <div className="flex items-center gap-3 text-sm font-semibold text-destructive">
                <span className="flex size-9 items-center justify-center rounded-lg bg-destructive/10">
                  <ShieldAlert className="size-5 stroke-[2.25]" />
                </span>
                Alerta de mora
              </div>
              <p className="mt-4 rounded-lg bg-destructive/5 px-3 py-2.5 text-sm leading-relaxed text-foreground">
                El cliente tiene un saldo en mora de{" "}
                <span className="font-semibold text-destructive">{formatCOP(contrato.moraAcumulada)}</span>{" "}
                correspondiente al periodo actual. Te recomendamos contactarlo para evitar un mayor atraso.
              </p>
              {contrato.cliente.telefono && (
                <a
                  href={`https://wa.me/57${telefonoLimpio(contrato.cliente.telefono)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto flex h-10 items-center justify-center gap-2 rounded-lg border border-success/30 bg-background text-sm font-semibold text-foreground transition-colors hover:bg-success/5 print:hidden"
                >
                  <MessageCircle className="size-4 text-success" />
                  Contactar por WhatsApp
                </a>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="min-h-[228px] border-success/20 bg-success/[0.045] shadow-[0_10px_30px_-24px_rgba(6,78,59,0.35)]">
            <CardContent className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <CalendarCheck className="size-7 text-success" />
              <p className="text-sm font-medium text-foreground">Este contrato está al día.</p>
              <p className="text-xs text-muted-foreground">Sin mora pendiente en el periodo actual.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tabs */}
        <div className="min-w-0 lg:col-span-2">
          <Tabs defaultValue="pagos" className="min-w-0">
            <TabsList variant="line" className="w-full justify-start overflow-x-auto print:hidden">
              <TabsTrigger value="pagos">Historial de pagos</TabsTrigger>
              <TabsTrigger value="periodos">Periodos</TabsTrigger>
              <TabsTrigger value="resumen">Resumen financiero</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="notas">Notas y seguimiento</TabsTrigger>
            </TabsList>

            <TabsContent value="pagos" className="pt-4">
              <TabHistorialPagos
                contratoId={contrato.id}
                pagos={contrato.pagos.map((p) => ({
                  id: p.id,
                  tipo: p.tipo,
                  fecha: p.fecha,
                  monto: p.monto,
                  metodoNombre: p.metodoPago.nombre,
                  referencia: p.referencia,
                  periodoCierreId: p.periodoCierreId,
                  periodo: p.periodoCierre,
                  correcciones: p._count.notasCorreccion,
                }))}
              />
            </TabsContent>

            <TabsContent value="periodos" className="pt-4">
              <TabPeriodos
                periodos={contrato.periodosCierre.map((periodo) => ({
                  ...periodo,
                  pagos: pagosPorPeriodo.get(periodo.id) ?? [],
                }))}
              />
            </TabsContent>

            <TabsContent value="resumen" className="pt-4">
              <TabResumenFinanciero
                totalRecaudado={totalRecaudadoHistorico}
                totalAbonadoCapital={totalAbonadoCapitalHistorico}
                periodosCerrados={contrato.periodosCierre.length}
                saldoCapitalPendiente={contrato.saldoCapitalPendiente}
                moraAcumulada={contrato.moraAcumulada}
                transferenciasCapital={contrato.transferenciasCapital.map((t) => ({
                  id: t.id,
                  monto: t.monto,
                  fecha: t.fecha,
                  notas: t.notas,
                  prestamoId: t.prestamo.id,
                }))}
              />
            </TabsContent>

            <TabsContent value="documentos" className="pt-4">
              <TabDocumentos
                contratoId={contrato.id}
                documentos={contrato.documentos.map((d) => ({
                  id: d.id,
                  tipo: d.tipo,
                  nombreOriginal: d.nombreOriginal,
                  rutaAlmacenamiento: d.rutaAlmacenamiento,
                  mimeType: d.mimeType,
                  tamanioBytes: d.tamanioBytes,
                  createdAt: formatFecha(d.createdAt),
                }))}
              />
            </TabsContent>

            <TabsContent value="notas" className="pt-4">
              <TabNotas
                contratoId={contrato.id}
                notas={contrato.notas.map((n) => ({
                  id: n.id,
                  contenido: n.contenido,
                  createdAt: formatFecha(n.createdAt),
                  pago: n.pago ? { fecha: formatFecha(n.pago.fecha), monto: n.pago.monto } : null,
                }))}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Barra lateral */}
        <div className="flex flex-col gap-6 print:hidden" id="acciones-rapidas">
          <AccionesRapidas
            contratoId={contrato.id}
            activo={activo}
            ultimoPeriodoId={ultimoPeriodoCerrado?.id}
            saldoCapitalPendiente={contrato.saldoCapitalPendiente}
            arriendoFijoMensual={contrato.arriendoFijoMensual}
            moraAcumulada={contrato.moraAcumulada}
            cobradoPeriodo={cobradoPeriodo}
            metodosPago={metodosPago}
          />

          {gastosMoto.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="size-4 text-muted-foreground" />
                  Gastos de la moto
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {gastosMoto.map((gasto) => (
                  <div key={gasto.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-foreground">{gasto.descripcion}</span>
                      <span className="text-xs text-muted-foreground">
                        {CATEGORIA_GASTO_LABEL[gasto.categoria]} · {formatFecha(gasto.fecha)}
                      </span>
                    </div>
                    <span className="shrink-0 tabular-nums text-foreground">{formatCOP(gasto.monto)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {prestamosCliente.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HandCoins className="size-4 text-muted-foreground" />
                  Préstamos del cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {prestamosCliente.map((prestamo) => (
                  <Link
                    key={prestamo.id}
                    href={`/prestamos/${prestamo.id}`}
                    className="-m-2 flex items-center justify-between gap-3 rounded-lg p-2 text-sm hover:bg-muted"
                  >
                    <div className="flex flex-col">
                      <span className="text-foreground">{formatCOP(prestamo.saldoPendiente)} pendiente</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        {formatFecha(prestamo.fecha)}
                      </span>
                    </div>
                    <Badge variant={prestamo.estado === "ACTIVO" ? "default" : "secondary"}>
                      {prestamo.estado === "ACTIVO" ? "Activo" : "Pagado"}
                    </Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Campo({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground">{etiqueta}</span>
      <span className="font-medium text-foreground">{valor}</span>
    </div>
  );
}

function CampoIcono({
  icono: Icono,
  etiqueta,
  valor,
}: {
  icono: typeof Calendar;
  etiqueta: string;
  valor: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-2.5 text-muted-foreground">
        <Icono className="size-4 shrink-0 text-primary" />
        <span className="truncate">{etiqueta}</span>
      </span>
      <span className="shrink-0 text-right font-semibold tabular-nums text-foreground">{valor}</span>
    </div>
  );
}

function MotoDato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-muted-foreground">{etiqueta}:</dt>
      <dd className="min-w-0 truncate font-medium text-primary">{valor}</dd>
    </div>
  );
}

function MiniStat({
  etiqueta,
  valor,
  tono,
  sub,
}: {
  etiqueta: string;
  valor: string;
  tono?: "success" | "warning";
  sub?: string;
}) {
  const color = tono === "success" ? "text-success" : tono === "warning" ? "text-warning" : "text-foreground";
  const superficie =
    tono === "success"
      ? "bg-success/[0.06] ring-success/10"
      : tono === "warning"
        ? "bg-warning/[0.07] ring-warning/10"
        : "bg-primary/[0.045] ring-primary/10";
  return (
    <div className={`rounded-lg px-3 py-2.5 ring-1 ${superficie}`}>
      <p className="text-xs leading-tight text-muted-foreground">{etiqueta}</p>
      <p className={`mt-1 text-base font-semibold tabular-nums ${color}`}>{valor}</p>
      {sub && <p className={`mt-0.5 text-xs font-bold ${color}`}>{sub}</p>}
    </div>
  );
}
