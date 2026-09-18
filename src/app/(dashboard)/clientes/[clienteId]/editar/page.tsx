import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ClienteForm } from "../../cliente-form";
import { updateCliente } from "../../actions";
import { MobilePageHeader } from "@/components/dashboard/mobile-page-header";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const { clienteId } = await params;
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });

  if (!cliente) {
    notFound();
  }

  const actionConId = updateCliente.bind(null, cliente.id);

  return (
    <div className="flex flex-col gap-4">
      <MobilePageHeader title="Editar cliente" backHref={`/clientes/${cliente.id}`} />

      <nav className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>
        <ChevronRight className="size-3" />
        <Link href="/clientes" className="hover:text-foreground">
          Clientes
        </Link>
        <ChevronRight className="size-3" />
        <Link href={`/clientes/${cliente.id}`} className="hover:text-foreground">
          {cliente.nombreCompleto}
        </Link>
        <ChevronRight className="size-3" />
        <span className="font-medium text-foreground">Editar</span>
      </nav>

      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Editar cliente</h1>
      <div className="max-w-xl">
        <ClienteForm
          action={actionConId}
          valoresIniciales={{
            nombreCompleto: cliente.nombreCompleto,
            tipoIdentificacion: cliente.tipoIdentificacion,
            numeroIdentificacion: cliente.numeroIdentificacion,
            telefono: cliente.telefono ?? undefined,
            email: cliente.email ?? undefined,
            direccion: cliente.direccion ?? undefined,
            notas: cliente.notas ?? undefined,
          }}
        />
      </div>
    </div>
  );
}
