import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Bike,
  Calendar,
  CalendarCheck,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  HandCoins,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  User,
  Wrench,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCOP, sumarPesos } from "@/lib/money";
import { diasDesde, formatFecha, formatFolioContrato, toFechaInputValue } from "@/lib/format";
import { estadoContratoInfo } from "@/lib/contrato-estado";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContratoForm } from "../contrato-form";
import { updateContrato } from "../actions";
import { PagoForm } from "../pago-form";
import { MobilePageHeader } from "@/components/dashboard/mobile-page-header";
import { ContratoHeaderActions } from "@/components/contratos/contrato-header-actions";
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
        },
      },
      periodosCierre: { orderBy: { numeroPeriodo: "desc" } },
      documentos: { orderBy: { createdAt: "desc" } },
      notas: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!contrato) {
    notFound();
  }

  const [gastosMoto, prestamosCliente] = await Promise.all([
    prisma.gasto.findMany({ where: { motocicletaId: contrato.motocicletaId }, orderBy: { fecha: "desc" } }),
    prisma.prestamo.findMany({ where: { clienteId: contrato.clienteId }, orderBy: { fecha: "desc" } }),
  ]);

  const actionConId = updateContrato.bind(null, contrato.id);
  const pagosAbiertos = contrato.pagos.filter((p) => p.periodoCierreId === null);
  const cobradoPeriodo = sumarPesos(...pagosAbiertos.map((p) => p.monto));
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
  );
  const totalAbonadoCapitalHistorico = sumarPesos(...contrato.periodosCierre.map((p) => p.abonoCapital));
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
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ContratoHeaderActions />
          {activo && (
            <a href="#registrar-pago" className={buttonVariants({ className: "print:hidden" })}>
              <Plus data-icon="inline-start" className="size-4" />
              Registrar pago
            </a>
          )}
        </div>
      </div>

      {/* Cliente / Motocicleta / Información del contrato */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="size-4" />
              Cliente
            </div>
            <div>
              <p className="font-semibold text-foreground">{contrato.cliente.nombreCompleto}</p>
              <p className="text-xs text-muted-foreground">CC {contrato.cliente.numeroIdentificacion}</p>
            </div>
            <div className="flex flex-col gap-1.5 text-sm">
              {contrato.cliente.telefono && (
                <>
                  <a href={`tel:${contrato.cliente.telefono}`} className="flex items-center gap-2 text-foreground hover:text-primary">
                    <Phone className="size-3.5 text-muted-foreground" />
                    {contrato.cliente.telefono}
                  </a>
                  <a
                    href={`https://wa.me/57${telefonoLimpio(contrato.cliente.telefono)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-foreground hover:text-success"
                  >
                    <MessageCircle className="size-3.5 text-success" />
                    {contrato.cliente.telefono}
                  </a>
                </>
              )}
              {contrato.cliente.direccion && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {contrato.cliente.direccion}
                </p>
              )}
            </div>
            <Link
              href={`/clientes/${contrato.cliente.id}`}
              className="mt-1 flex items-center justify-center gap-1 rounded-lg border border-border py-1.5 text-sm font-medium text-primary hover:bg-muted"
            >
              Ver perfil del cliente
              <ChevronRight className="size-3.5" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Bike className="size-4" />
              Motocicleta
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                {contrato.motocicleta.fotoUrl ? (
                  <Image src={contrato.motocicleta.fotoUrl} alt={contrato.motocicleta.placa} fill className="object-cover" />
                ) : (
                  <Bike className="size-6 text-muted-foreground" />
                )}
              </div>
              <p className="font-semibold text-foreground">
                {contrato.motocicleta.marca} {contrato.motocicleta.modelo}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
              <Campo etiqueta="Placa" valor={contrato.motocicleta.placa} />
              <Campo etiqueta="Marca" valor={contrato.motocicleta.marca} />
              <Campo etiqueta="Modelo" valor={contrato.motocicleta.modelo} />
              {contrato.motocicleta.anioModelo && <Campo etiqueta="Año" valor={contrato.motocicleta.anioModelo.toString()} />}
              {contrato.motocicleta.color && <Campo etiqueta="Color" valor={contrato.motocicleta.color} />}
            </div>
            <Link
              href={`/motos/${contrato.motocicleta.id}`}
              className="mt-1 flex items-center justify-center gap-1 rounded-lg border border-border py-1.5 text-sm font-medium text-primary hover:bg-muted"
            >
              Ver ficha de la moto
              <ChevronRight className="size-3.5" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="size-4" />
              Información del contrato
            </div>
            <div className="flex flex-col gap-2.5 text-sm">
              <CampoIcono icono={Calendar} etiqueta="Fecha de inicio" valor={formatFecha(contrato.fechaInicio)} />
              <CampoIcono icono={CreditCard} etiqueta="Precio de la moto" valor={formatCOP(contrato.valorTotalContrato)} />
              <CampoIcono icono={Clock} etiqueta="Arriendo por periodo" valor={formatCOP(contrato.arriendoFijoMensual)} />
              <CampoIcono
                icono={CalendarCheck}
                etiqueta="Periodo abierto"
                valor={activo ? `1 (${diasPeriodoAbierto} día${diasPeriodoAbierto === 1 ? "" : "s"})` : "0"}
              />
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="size-3.5" />
                  Estado
                </span>
                <Badge variant={estado.variant}>{estado.label}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado financiero / Último periodo / Alerta de mora */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-muted-foreground" />
              Estado financiero
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progreso de compra</span>
                <span className="font-semibold text-foreground">{progresoCompra}%</span>
              </div>
              <Progress value={progresoCompra}>
                <ProgressTrack>
                  <ProgressIndicator />
                </ProgressTrack>
              </Progress>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="size-4 text-muted-foreground" />
              {activo ? "Periodo actual" : "Último estado"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {activo ? (
              <>
                <div className="grid grid-cols-2 gap-2.5 text-sm">
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
                <a
                  href="#acciones-rapidas"
                  className="flex items-center justify-center gap-1 rounded-lg border border-primary/30 bg-primary/5 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 print:hidden"
                >
                  Cerrar periodo
                  <ChevronRight className="size-3.5" />
                </a>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {contrato.finalizadoAt ? `Finalizado el ${formatFecha(contrato.finalizadoAt)}.` : "Este contrato ya no está activo."}
              </p>
            )}
          </CardContent>
        </Card>

        {contrato.moraAcumulada > 0 ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex h-full flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <Clock className="size-4" />
                Alerta de mora
              </div>
              <p className="text-sm text-foreground">
                El cliente tiene un saldo en mora de{" "}
                <span className="font-semibold text-destructive">{formatCOP(contrato.moraAcumulada)}</span>{" "}
                correspondiente al periodo actual. Te recomendamos contactarlo para evitar un mayor atraso.
              </p>
              {contrato.cliente.telefono && (
                <a
                  href={`https://wa.me/57${telefonoLimpio(contrato.cliente.telefono)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto flex items-center justify-center gap-2 rounded-lg border border-border bg-background py-1.5 text-sm font-medium text-foreground hover:bg-muted print:hidden"
                >
                  <MessageCircle className="size-4 text-success" />
                  Contactar por WhatsApp
                </a>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-success/30 bg-success/5">
            <CardContent className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <CalendarCheck className="size-7 text-success" />
              <p className="text-sm font-medium text-foreground">Este contrato está al día.</p>
              <p className="text-xs text-muted-foreground">Sin mora pendiente en el periodo actual.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Registrar pago */}
      {activo && (
        <Card id="registrar-pago" className="print:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="size-4 text-muted-foreground" />
              Registrar nuevo pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PagoForm contratoId={contrato.id} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="pagos">
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
                  fecha: p.fecha,
                  monto: p.monto,
                  metodo: p.metodo,
                  referencia: p.referencia,
                  periodoCierreId: p.periodoCierreId,
                  periodo: p.periodoCierre,
                }))}
              />
            </TabsContent>

            <TabsContent value="periodos" className="pt-4">
              <TabPeriodos periodos={contrato.periodosCierre} />
            </TabsContent>

            <TabsContent value="resumen" className="pt-4">
              <TabResumenFinanciero
                totalRecaudado={totalRecaudadoHistorico}
                totalAbonadoCapital={totalAbonadoCapitalHistorico}
                periodosCerrados={contrato.periodosCierre.length}
                saldoCapitalPendiente={contrato.saldoCapitalPendiente}
                moraAcumulada={contrato.moraAcumulada}
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
                }))}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Barra lateral */}
        <div className="flex flex-col gap-6 print:hidden" id="acciones-rapidas">
          <AccionesRapidas contratoId={contrato.id} activo={activo} ultimoPeriodoId={ultimoPeriodoCerrado?.id} />

          {activo && (
            <Card id="editar-contrato">
              <CardHeader>
                <CardTitle>Editar términos</CardTitle>
              </CardHeader>
              <CardContent>
                <ContratoForm
                  modo="editar"
                  action={actionConId}
                  valoresIniciales={{
                    arriendoFijoMensual: contrato.arriendoFijoMensual.toString(),
                    metaMensualReferencia: contrato.metaMensualReferencia?.toString(),
                    cuotaDiariaReferencia: contrato.cuotaDiariaReferencia?.toString(),
                    fechaFinEstimada: contrato.fechaFinEstimada ? toFechaInputValue(contrato.fechaFinEstimada) : undefined,
                  }}
                />
              </CardContent>
            </Card>
          )}

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
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icono className="size-3.5" />
        {etiqueta}
      </span>
      <span className="font-medium text-foreground">{valor}</span>
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
  return (
    <div className="rounded-lg border border-border p-2.5">
      <p className="text-xs text-muted-foreground">{etiqueta}</p>
      <p className={`font-semibold tabular-nums ${color}`}>{valor}</p>
      {sub && <p className={`text-xs font-medium ${color}`}>{sub}</p>}
    </div>
  );
}
