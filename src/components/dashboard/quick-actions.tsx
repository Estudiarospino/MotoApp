import Link from "next/link";
import { Bike, ClipboardList, HandCoins, Receipt, Users, Wrench } from "lucide-react";
import { cn } from "cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogTrigger } from "@/components/ui/dialog";
import { RegistrarPagoPicker, type ContratoParaPago } from "@/components/pagos/registrar-pago-picker";

const ACCIONES = [
  { label: "Nuevo cliente", href: "/clientes/nuevo", icon: Users },
  { label: "Nueva moto", href: "/motos/nueva", icon: Bike },
  { label: "Registrar gasto", href: "/gastos/nuevo", icon: Wrench },
  { label: "Nuevo préstamo", href: "/prestamos/nuevo", icon: HandCoins },
];

const CLASE_BOTON = "flex items-center gap-2 rounded-lg border border-border px-2.5 py-2.5 text-[13px] font-medium transition-colors hover:bg-muted";

export function QuickActions({ contratosActivos }: { contratosActivos: ContratoParaPago[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Acciones rápidas</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        <Link
          href="/contratos/nuevo"
          className={cn(CLASE_BOTON, "border-transparent bg-primary text-primary-foreground hover:bg-primary/90")}
        >
          <ClipboardList className="size-4 shrink-0" />
          <span className="truncate">Nuevo contrato</span>
        </Link>

        <RegistrarPagoPicker
          contratos={contratosActivos}
          trigger={
            <DialogTrigger className={CLASE_BOTON}>
              <Receipt className="size-4 shrink-0" />
              <span className="truncate">Registrar pago</span>
            </DialogTrigger>
          }
        />

        {ACCIONES.map((accion) => (
          <Link key={accion.href} href={accion.href} className={CLASE_BOTON}>
            <accion.icon className="size-4 shrink-0" />
            <span className="truncate">{accion.label}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
