import Link from "next/link";
import { Bike, ClipboardList, HandCoins, Receipt, Users, Wrench } from "lucide-react";
import { cn } from "cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ACCIONES = [
  { label: "Nuevo contrato", href: "/contratos/nuevo", icon: ClipboardList, destacado: true },
  { label: "Registrar pago", href: "/pagos", icon: Receipt },
  { label: "Nuevo cliente", href: "/clientes/nuevo", icon: Users },
  { label: "Nueva moto", href: "/motos/nueva", icon: Bike },
  { label: "Registrar gasto", href: "/gastos/nuevo", icon: Wrench },
  { label: "Nuevo préstamo", href: "/prestamos/nuevo", icon: HandCoins },
];

export function QuickActions() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Acciones rápidas</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {ACCIONES.map((accion) => (
          <Link
            key={accion.href}
            href={accion.href}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-border px-2.5 py-2.5 text-[13px] font-medium transition-colors hover:bg-muted",
              accion.destacado && "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            <accion.icon className="size-4 shrink-0" />
            <span className="truncate">{accion.label}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
