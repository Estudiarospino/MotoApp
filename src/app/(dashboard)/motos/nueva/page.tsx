import { MotoForm } from "../moto-form";
import { createMotocicleta } from "../actions";

export default function NuevaMotoPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Nueva moto</h1>
      <MotoForm action={createMotocicleta} />
    </div>
  );
}
