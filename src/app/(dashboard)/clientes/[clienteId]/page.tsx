import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Calendar,
  CheckSquare,
  ChevronRight,
  ClipboardList,
  Clock,
  HandCoins,
  IdCard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Receipt,
  StickyNote,
  User,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCOP, sumarPesos } from "@/lib/money";
import { diasDesde, formatFecha, formatFolioContrato } from "@/lib/format";
import { estadoContratoInfo } from "@/lib/contrato-estado";
import { colorAvatar, iniciales } from "@/lib/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconStatCard } from "@/components/icon-stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClienteMoreMenu } from "@/components/clientes/cliente-more-menu";
import { MobilePageHeader } from "@/components/dashboard/mobile-page-header";
import { toggleActivoCliente } from "../actions";

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const { clienteId } = await params;

  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    include: {
      contratos: {
        orderBy: { createdAt: "desc" },
        include: {
          motocicleta: { select: { placa: true, marca: true, modelo: true } },
          pagos: { orderBy: { fecha: "desc" }, include: { metodoPago: { select: { nombre: true } } } },
        },
      },
      prestamos: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!cliente) {
    notFound();
  }

  const contratosActivos = cliente.contratos.filter((c) => c.estado === "ACTIVO");
  const saldoMora = sumarPesos(...contratosActivos.map((c) => c.moraAcumulada));
  const pagos = cliente.contratos
    .flatMap((c) => c.pagos.map((p) => ({ ...p, folio: c.folio })))
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  const ultimoPago = pagos[0];
  const diasConNosotros = diasDesde(cliente.createdAt);
  const color = colorAvatar(cliente.id);
  const toggleConId = toggleActivoCliente.bind(null, cliente.id);

  return (
    <div className="flex flex-col gap-6">
      <nav className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>
        <ChevronRight className="size-3" />
        <Link href="/clientes" className="hover:text-foreground">
          Clientes
        </Link>
        <ChevronRight className="size-3" />
        <span className="font-medium text-foreground">{cliente.nombreCompleto}</span>
      </nav>

      <MobilePageHeader title={cliente.nombreCompleto} backHref="/clientes" />

      <div className="flex items-start justify-between gap-3 sm:items-center">
        <div className="flex items-center gap-3.5">
          <span
            className={`flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${color.bg} ${color.text}`}
          >
            {iniciales(cliente.nombreCompleto)}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{cliente.nombreCompleto}</h1>
              <Badge variant={cliente.activo ? "success" : "secondary"}>{cliente.activo ? "Activo" : "Inactivo"}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {cliente.tipoIdentificacion} {cliente.numeroIdentificacion}
              {cliente.telefono && (
                <>
                  {" · "}
                  <a
                    href={`https://wa.me/57${cliente.telefono.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-success"
                  >
                    {cliente.telefono}
                  </a>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/clientes/${cliente.id}/editar`}
            className={cn(buttonVariants({ variant: "outline" }), "hidden sm:inline-flex")}
          >
            <Pencil data-icon="inline-start" className="size-4" />
            Editar cliente
          </Link>
          <Link
            href={`/contratos/nuevo?clienteId=${cliente.id}`}
            className={cn(buttonVariants(), "hidden sm:inline-flex")}
          >
            <Plus data-icon="inline-start" className="size-4" />
            Nuevo contrato
          </Link>
          <ClienteMoreMenu activo={cliente.activo} onToggleActivo={toggleConId} />
        </div>
      </div>

      <Tabs defaultValue="resumen">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="contratos">Contratos ({cliente.contratos.length})</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
          <TabsTrigger value="prestamos">Préstamos</TabsTrigger>
          {cliente.notas && <TabsTrigger value="mas">Más</TabsTrigger>}
        </TabsList>

        <TabsContent value="resumen" className="flex flex-col gap-6 pt-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <IconStatCard
              icon={ClipboardList}
              label="Contratos activos"
              value={contratosActivos.length.toString()}
              hint="en arriendo"
            />
            <IconStatCard
              icon={Calendar}
              label="Último pago"
              value={ultimoPago ? formatFecha(ultimoPago.fecha) : "Sin pagos"}
              hint={ultimoPago ? formatCOP(ultimoPago.monto) : "—"}
            />
            <IconStatCard
              icon={AlertTriangle}
              label="Saldo en mora"
              value={formatCOP(saldoMora)}
              tono={saldoMora > 0 ? "warning" : "success"}
              hint={saldoMora > 0 ? "con mora pendiente" : "al día"}
            />
            <IconStatCard
              icon={Clock}
              label="Tiempo con nosotros"
              value={`${diasConNosotros} días`}
              hint="desde el inicio"
            />
          </div>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-foreground">Información del cliente</h2>
                <Link href={`/clientes/${cliente.id}/editar`} className="text-sm font-medium text-primary hover:underline">
                  Editar
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <InfoRow icon={User} label="Nombre completo" value={cliente.nombreCompleto} />
                <InfoRow
                  icon={IdCard}
                  label="Identificación"
                  value={`${cliente.tipoIdentificacion} ${cliente.numeroIdentificacion}`}
                />
                <InfoRow icon={Phone} label="Teléfono" value={cliente.telefono ?? "—"} />
                <InfoRow icon={Mail} label="Email" value={cliente.email ?? "—"} />
                <InfoRow icon={MapPin} label="Dirección" value={cliente.direccion ?? "—"} />
                <InfoRow
                  icon={CheckSquare}
                  label="Estado"
                  value={<Badge variant={cliente.activo ? "success" : "secondary"}>{cliente.activo ? "Activo" : "Inactivo"}</Badge>}
                />
                <InfoRow icon={Calendar} label="Fecha de registro" value={formatFecha(cliente.createdAt)} />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-2 sm:hidden">
            <Link href={`/clientes/${cliente.id}/editar`} className={buttonVariants({ variant: "outline" })}>
              <Pencil data-icon="inline-start" className="size-4" />
              Editar cliente
            </Link>
            <Link href={`/contratos/nuevo?clienteId=${cliente.id}`} className={buttonVariants()}>
              <Plus data-icon="inline-start" className="size-4" />
              Nuevo contrato
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="contratos" className="pt-4">
          {cliente.contratos.length === 0 ? (
            <EmptyState icon={ClipboardList} texto="Este cliente todavía no tiene contratos." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Folio</TableHead>
                    <TableHead>Motocicleta</TableHead>
                    <TableHead className="hidden sm:table-cell">Saldo capital</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cliente.contratos.map((contrato) => {
                    const estado = estadoContratoInfo(contrato);
                    return (
                      <TableRow key={contrato.id}>
                        <TableCell className="font-medium">{formatFolioContrato(contrato.folio)}</TableCell>
                        <TableCell>
                          {contrato.motocicleta.placa} — {contrato.motocicleta.marca} {contrato.motocicleta.modelo}
                        </TableCell>
                        <TableCell className="hidden tabular-nums sm:table-cell">
                          {formatCOP(contrato.saldoCapitalPendiente)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={estado.variant}>{estado.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/contratos/${contrato.id}`}
                            className={buttonVariants({ variant: "outline", size: "sm" })}
                          >
                            Ver
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pagos" className="pt-4">
          {pagos.length === 0 ? (
            <EmptyState icon={Receipt} texto="Este cliente todavía no tiene pagos registrados." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead className="hidden sm:table-cell">Método</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagos.map((pago) => (
                    <TableRow key={pago.id}>
                      <TableCell>{formatFecha(pago.fecha)}</TableCell>
                      <TableCell>{formatFolioContrato(pago.folio)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{pago.metodoPago.nombre}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatCOP(pago.monto)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="prestamos" className="pt-4">
          {cliente.prestamos.length === 0 ? (
            <EmptyState icon={HandCoins} texto="Este cliente todavía no tiene préstamos." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="hidden sm:table-cell">Monto original</TableHead>
                    <TableHead>Saldo pendiente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cliente.prestamos.map((prestamo) => (
                    <TableRow key={prestamo.id}>
                      <TableCell>{formatFecha(prestamo.fecha)}</TableCell>
                      <TableCell className="hidden tabular-nums sm:table-cell">
                        {formatCOP(prestamo.montoOriginal)}
                      </TableCell>
                      <TableCell className="tabular-nums">{formatCOP(prestamo.saldoPendiente)}</TableCell>
                      <TableCell>
                        <Badge variant={prestamo.estado === "ACTIVO" ? "default" : "secondary"}>
                          {prestamo.estado === "ACTIVO" ? "Activo" : "Pagado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/prestamos/${prestamo.id}`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          Ver
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {cliente.notas && (
          <TabsContent value="mas" className="pt-4">
            <Card>
              <CardContent className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <StickyNote className="size-4" />
                </span>
                <p className="text-sm whitespace-pre-wrap text-foreground">{cliente.notas}</p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function EmptyState({ icon: Icon, texto }: { icon: LucideIcon; texto: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        <Icon className="size-7 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{texto}</p>
      </CardContent>
    </Card>
  );
}
