import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowRightLeft,
  Banknote,
  Bike,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Database,
  FileText,
  Mail,
  MapPin,
  Phone,
  Plus,
  StickyNote,
  User,
  UserCircle,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCOP, restarPesos, sumarPesos } from "@/lib/money";
import { diasDesde, formatFecha, formatFolioContrato, formatFolioPrestamo } from "@/lib/format";
import { colorAvatar, iniciales } from "@/lib/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconStatCard } from "@/components/icon-stat-card";
import { ImprimirButton } from "@/components/imprimir-button";
import { DialogTrigger } from "@/components/ui/dialog";
import { MovimientosPrestamo, type MovimientoPrestamo } from "@/components/prestamos/movimientos-prestamo";
import { AbonoDialog } from "../abono-dialog";
import { EditarPrestamoDialog } from "../editar-prestamo-dialog";
import { NotaDialog } from "../nota-dialog";
import { PrestamoMasAccionesMenu } from "../prestamo-mas-acciones-menu";

export default async function PrestamoDetallePage({
  params,
}: {
  params: Promise<{ prestamoId: string }>;
}) {
  const { prestamoId } = await params;
  const prestamo = await prisma.prestamo.findUnique({
    where: { id: prestamoId },
    include: {
      cliente: true,
      motocicleta: true,
      contrato: { select: { id: true, folio: true } },
      abonos: {
        orderBy: { fecha: "desc" },
        include: { metodoPago: { select: { nombre: true } } },
      },
      transferenciasCapital: {
        orderBy: { fecha: "desc" },
        include: { contrato: { select: { id: true, folio: true } } },
      },
      notas: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!prestamo) {
    notFound();
  }

  const activo = prestamo.estado === "ACTIVO";

  const [posicion, metodosPago, motos, contratosCliente] = await Promise.all([
    prisma.prestamo.count({ where: { createdAt: { lte: prestamo.createdAt } } }),
    prisma.metodoPago.findMany({ where: { activo: true }, orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
    prisma.motocicleta.findMany({ orderBy: { placa: "asc" }, select: { id: true, placa: true, marca: true, modelo: true } }),
    activo
      ? prisma.contrato.findMany({
          where: { clienteId: prestamo.clienteId, estado: "ACTIVO" },
          orderBy: { folio: "desc" },
          select: { id: true, folio: true },
        })
      : Promise.resolve([]),
  ]);
  const montoPagado = restarPesos(prestamo.montoOriginal, prestamo.saldoPendiente);
  const totalPagos = prestamo.abonos.length;
  const totalTransferido = sumarPesos(...prestamo.transferenciasCapital.map((t) => t.monto));
  const pctPagado = prestamo.montoOriginal === 0 ? 100 : Math.round((montoPagado / prestamo.montoOriginal) * 100);

  const movimientos: MovimientoPrestamo[] = [
    ...prestamo.abonos.map((a) => ({
      id: a.id,
      fecha: a.fecha,
      tipo: "PAGO" as const,
      descripcion: a.metodoPago ? `Abono registrado — ${a.metodoPago.nombre}` : "Abono registrado",
      monto: a.monto,
      referenciaLabel: null,
      referenciaHref: null,
    })),
    ...prestamo.transferenciasCapital.map((t) => ({
      id: t.id,
      fecha: t.fecha,
      tipo: "TRANSFERENCIA" as const,
      descripcion: t.notas ? `Transferido a capital — ${t.notas}` : "Transferido a capital del contrato",
      monto: t.monto,
      referenciaLabel: formatFolioContrato(t.contrato.folio),
      referenciaHref: `/contratos/${t.contrato.id}`,
    })),
  ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  const fechaFinalizacion = !activo && movimientos.length > 0 ? movimientos[0].fecha : null;

  const dias = diasDesde(prestamo.fecha);
  const haceTexto = dias === 0 ? "Hoy" : dias === 1 ? "Hace 1 día" : `Hace ${dias} días`;
  const color = colorAvatar(prestamo.cliente.id);

  return (
    <div className="flex flex-col gap-6">
      <nav className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex print:hidden">
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>
        <ChevronRight className="size-3" />
        <Link href="/prestamos" className="hover:text-foreground">
          Préstamos
        </Link>
        <ChevronRight className="size-3" />
        <span className="font-medium text-foreground">Detalle</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Préstamo #{formatFolioPrestamo(posicion)}
            </h1>
            <Badge variant={activo ? "info" : "success"}>{activo ? "Activo" : "Pagado"}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulta la información del préstamo, pagos realizados y movimientos asociados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ImprimirButton />
          <PrestamoMasAccionesMenu
            prestamoId={prestamo.id}
            transferencia={
              activo
                ? {
                    saldoPendiente: prestamo.saldoPendiente,
                    contratos: contratosCliente,
                    contratoIdInicial: prestamo.contratoId ?? undefined,
                  }
                : undefined
            }
          />
          {activo ? (
            <AbonoDialog
              prestamoId={prestamo.id}
              metodosPago={metodosPago}
              trigger={
                <DialogTrigger className={buttonVariants()}>
                  <Plus data-icon="inline-start" className="size-4" />
                  Registrar pago
                </DialogTrigger>
              }
            />
          ) : (
            <button
              type="button"
              disabled
              title="Este préstamo ya está pagado."
              className={buttonVariants({ className: "cursor-not-allowed opacity-40" })}
            >
              <Plus data-icon="inline-start" className="size-4" />
              Registrar pago
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <IconStatCard icon={Banknote} label="Monto original" value={formatCOP(prestamo.montoOriginal)} />
        <IconStatCard
          icon={Database}
          label="Saldo pendiente"
          value={formatCOP(prestamo.saldoPendiente)}
          tono={activo ? "warning" : "success"}
          progreso={pctPagado}
          hint={`${pctPagado}% pagado · ${totalPagos} pago${totalPagos === 1 ? "" : "s"}`}
        />
        <IconStatCard icon={Calendar} label="Fecha de inicio" value={formatFecha(prestamo.fecha)} hint={haceTexto} />
        <IconStatCard
          icon={FileText}
          label="Contrato asociado"
          value={prestamo.contrato ? formatFolioContrato(prestamo.contrato.folio) : "—"}
          hint={prestamo.contrato ? "Ver contrato" : "Sin contrato asociado"}
          href={prestamo.contrato ? `/contratos/${prestamo.contrato.id}` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="has-data-[slot=card-action]:grid-cols-[1fr_auto]">
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="size-4 text-muted-foreground" />
                Información del cliente
              </CardTitle>
              <CardAction>
                <Link
                  href={`/clientes/${prestamo.clienteId}`}
                  className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Ver cliente
                  <ChevronRight className="size-3.5" />
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${color.bg} ${color.text}`}
                >
                  {iniciales(prestamo.cliente.nombreCompleto)}
                </span>
                <div>
                  <p className="font-medium text-foreground">{prestamo.cliente.nombreCompleto}</p>
                  <p className="text-xs text-muted-foreground">
                    {prestamo.cliente.tipoIdentificacion} {prestamo.cliente.numeroIdentificacion}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                {prestamo.cliente.telefono && (
                  <span className="flex items-center gap-2">
                    <Phone className="size-3.5" />
                    {prestamo.cliente.telefono}
                  </span>
                )}
                {prestamo.cliente.email && (
                  <span className="flex items-center gap-2">
                    <Mail className="size-3.5" />
                    {prestamo.cliente.email}
                  </span>
                )}
                {prestamo.cliente.direccion && (
                  <span className="flex items-center gap-2">
                    <MapPin className="size-3.5" />
                    {prestamo.cliente.direccion}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="has-data-[slot=card-action]:grid-cols-[1fr_auto]">
              <CardTitle className="flex items-center gap-2">
                <Bike className="size-4 text-muted-foreground" />
                Motocicleta asociada
              </CardTitle>
              {prestamo.motocicleta && (
                <CardAction>
                  <Link
                    href={`/motos/${prestamo.motocicleta.id}`}
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Ver motocicleta
                    <ChevronRight className="size-3.5" />
                  </Link>
                </CardAction>
              )}
            </CardHeader>
            <CardContent>
              {prestamo.motocicleta ? (
                <div className="flex items-center gap-4">
                  <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                    {prestamo.motocicleta.fotoUrl ? (
                      <Image
                        src={prestamo.motocicleta.fotoUrl}
                        alt={prestamo.motocicleta.placa}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Bike className="size-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {prestamo.motocicleta.marca} {prestamo.motocicleta.modelo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Placa: {prestamo.motocicleta.placa}
                      {prestamo.motocicleta.color && ` · Color: ${prestamo.motocicleta.color}`}
                      {prestamo.motocicleta.anioModelo && ` · Año: ${prestamo.motocicleta.anioModelo}`}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="py-2 text-sm text-muted-foreground">Este préstamo no tiene una motocicleta asociada.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="has-data-[slot=card-action]:grid-cols-[1fr_auto]">
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                Detalles del préstamo
              </CardTitle>
              <CardAction>
                <EditarPrestamoDialog
                  prestamo={{
                    id: prestamo.id,
                    fecha: prestamo.fecha,
                    motocicletaId: prestamo.motocicletaId,
                    motivo: prestamo.motivo,
                  }}
                  motos={motos}
                />
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Monto original</p>
                  <p className="font-medium text-foreground">{formatCOP(prestamo.montoOriginal)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha de inicio</p>
                  <p className="font-medium text-foreground">{formatFecha(prestamo.fecha)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo pendiente</p>
                  <p className="font-medium text-foreground">{formatCOP(prestamo.saldoPendiente)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha de finalización</p>
                  <p className="font-medium text-foreground">
                    {fechaFinalizacion ? formatFecha(fechaFinalizacion) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Monto pagado</p>
                  <p className="font-medium text-foreground">{formatCOP(montoPagado)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <Badge variant={activo ? "info" : "success"}>{activo ? "Activo" : "Pagado"}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total de pagos</p>
                  <p className="font-medium text-foreground">{totalPagos}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contrato asociado</p>
                  {prestamo.contrato ? (
                    <Link
                      href={`/contratos/${prestamo.contrato.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {formatFolioContrato(prestamo.contrato.folio)}
                    </Link>
                  ) : (
                    <p className="font-medium text-foreground">—</p>
                  )}
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Motivo</p>
                  <p className="font-medium text-foreground">{prestamo.motivo ?? "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="size-4 text-muted-foreground" />
                Movimientos del préstamo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MovimientosPrestamo movimientos={movimientos} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-4 text-muted-foreground" />
                Resumen financiero
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Monto original</span>
                  <span className="font-medium tabular-nums text-foreground">
                    {formatCOP(prestamo.montoOriginal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total pagado</span>
                  <span className="font-medium tabular-nums text-foreground">{formatCOP(montoPagado)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total transferido a capital</span>
                  <span className="font-medium tabular-nums text-foreground">{formatCOP(totalTransferido)}</span>
                </div>
              </div>

              {!activo && (
                <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/[0.06] p-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                  <div>
                    <p className="text-sm font-medium text-success">Préstamo liquidado</p>
                    <p className="text-xs text-muted-foreground">
                      El préstamo ha sido completado en su totalidad.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <NotaDialog
                prestamoId={prestamo.id}
                trigger={
                  <DialogTrigger className={buttonVariants({ variant: "outline", className: "self-start" })}>
                    <StickyNote data-icon="inline-start" className="size-4" />
                    Agregar nota
                  </DialogTrigger>
                }
              />

              {prestamo.notas.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Todavía no hay notas.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {prestamo.notas.map((nota) => (
                    <div key={nota.id} className="flex gap-3 rounded-lg border border-border p-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <StickyNote className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm whitespace-pre-wrap text-foreground">{nota.contenido}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatFecha(nota.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Link href={`/clientes/${prestamo.clienteId}`} className={buttonVariants({ variant: "outline" })}>
                <User data-icon="inline-start" className="size-4" />
                Ver cliente
              </Link>
              {prestamo.contrato ? (
                <Link href={`/contratos/${prestamo.contrato.id}`} className={buttonVariants({ variant: "outline" })}>
                  <FileText data-icon="inline-start" className="size-4" />
                  Ver contrato
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Este préstamo no tiene contrato asociado."
                  className={buttonVariants({ variant: "outline", className: "cursor-not-allowed opacity-40" })}
                >
                  <FileText data-icon="inline-start" className="size-4" />
                  Ver contrato
                </button>
              )}
              <NotaDialog
                prestamoId={prestamo.id}
                trigger={
                  <DialogTrigger className={buttonVariants({ variant: "outline" })}>
                    <StickyNote data-icon="inline-start" className="size-4" />
                    Agregar nota
                  </DialogTrigger>
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
