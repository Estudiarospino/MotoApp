import { Landmark, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCOP, sumarPesos } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NuevaCuentaDialog } from "./nueva-cuenta-dialog";
import { NuevoMetodoDialog } from "./nuevo-metodo-dialog";
import { ToggleCuentaButton } from "./toggle-cuenta-button";
import { ToggleMetodoButton } from "./toggle-metodo-button";

export default async function ConfiguracionPage() {
  const [cuentas, metodosPago, pagosPorMetodo, gastosPorMetodo] = await Promise.all([
    prisma.cuenta.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.metodoPago.findMany({
      orderBy: { createdAt: "asc" },
      include: { cuenta: { select: { id: true, nombre: true } } },
    }),
    prisma.pago.groupBy({ by: ["metodoPagoId"], _sum: { monto: true } }),
    prisma.gasto.groupBy({ by: ["metodoPagoId"], _sum: { monto: true }, where: { metodoPagoId: { not: null } } }),
  ]);

  const recaudadoPorMetodo = new Map(pagosPorMetodo.map((p) => [p.metodoPagoId, p._sum.monto ?? 0]));
  const gastadoPorMetodo = new Map(gastosPorMetodo.map((g) => [g.metodoPagoId as string, g._sum.monto ?? 0]));

  const saldoPorCuenta = new Map<string, number>();
  for (const cuenta of cuentas) saldoPorCuenta.set(cuenta.id, cuenta.saldoInicial);
  for (const metodo of metodosPago) {
    const movimiento = (recaudadoPorMetodo.get(metodo.id) ?? 0) - (gastadoPorMetodo.get(metodo.id) ?? 0);
    saldoPorCuenta.set(metodo.cuentaId, sumarPesos(saldoPorCuenta.get(metodo.cuentaId) ?? 0, movimiento));
  }

  const cuentasActivas = cuentas.filter((c) => c.activa);
  const saldoTotal = sumarPesos(...cuentasActivas.map((c) => saldoPorCuenta.get(c.id) ?? 0));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Cuentas y métodos de pago del negocio — de aquí sale el desplegable de &ldquo;Método&rdquo; al registrar un pago.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="size-4 text-muted-foreground" />
              Cuentas
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Saldo total en cuentas activas: <span className="font-medium text-foreground">{formatCOP(saldoTotal)}</span>
            </p>
          </div>
          <NuevaCuentaDialog />
        </CardHeader>
        <CardContent>
          {cuentas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Todavía no hay cuentas creadas.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Titular</TableHead>
                    <TableHead className="hidden sm:table-cell">Banco</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuentas.map((cuenta) => (
                    <TableRow key={cuenta.id}>
                      <TableCell className="font-medium">{cuenta.nombre}</TableCell>
                      <TableCell className="text-muted-foreground">{cuenta.titular}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {cuenta.banco ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCOP(saldoPorCuenta.get(cuenta.id) ?? 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cuenta.activa ? "success" : "secondary"}>
                          {cuenta.activa ? "Activa" : "Inactiva"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <ToggleCuentaButton id={cuenta.id} activa={cuenta.activa} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="size-4 text-muted-foreground" />
              Métodos de pago
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Solo los métodos activos aparecen en el desplegable al registrar un pago.
            </p>
          </div>
          <NuevoMetodoDialog cuentas={cuentas.filter((c) => c.activa).map((c) => ({ id: c.id, nombre: c.nombre }))} />
        </CardHeader>
        <CardContent>
          {metodosPago.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {cuentas.length === 0
                ? "Crea una cuenta primero para poder agregar métodos de pago."
                : "Todavía no hay métodos de pago creados."}
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metodosPago.map((metodo) => (
                    <TableRow key={metodo.id}>
                      <TableCell className="font-medium">{metodo.nombre}</TableCell>
                      <TableCell className="text-muted-foreground">{metodo.cuenta.nombre}</TableCell>
                      <TableCell>
                        <Badge variant={metodo.activo ? "success" : "secondary"}>
                          {metodo.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <ToggleMetodoButton id={metodo.id} activo={metodo.activo} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
