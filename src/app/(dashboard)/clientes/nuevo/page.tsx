import { ClienteForm } from "../cliente-form";
import { createCliente } from "../actions";

export default function NuevoClientePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nuevo cliente</h1>
      <ClienteForm action={createCliente} />
    </div>
  );
}
