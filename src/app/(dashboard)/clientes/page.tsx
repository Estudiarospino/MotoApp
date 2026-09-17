import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toggleActivoCliente } from "./actions";

export default async function ClientesPage() {
  const clientes = await prisma.cliente.findMany({
    orderBy: { nombreCompleto: "asc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Clientes</h1>
        <Link href="/clientes/nuevo" className={buttonVariants()}>
          Nuevo cliente
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Identificación</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-zinc-500">
                  Todavía no hay clientes registrados.
                </TableCell>
              </TableRow>
            )}

            {clientes.map((cliente) => {
              const toggleConId = toggleActivoCliente.bind(null, cliente.id);
              return (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">{cliente.nombreCompleto}</TableCell>
                  <TableCell>
                    {cliente.tipoIdentificacion} {cliente.numeroIdentificacion}
                  </TableCell>
                  <TableCell>{cliente.telefono ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={cliente.activo ? "default" : "secondary"}>
                      {cliente.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2 text-right">
                    <Link
                      href={`/clientes/${cliente.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Editar
                    </Link>
                    <form action={toggleConId}>
                      <Button type="submit" variant="ghost" size="sm">
                        {cliente.activo ? "Desactivar" : "Activar"}
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
