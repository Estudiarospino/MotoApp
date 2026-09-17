import { getCurrentUser } from "@/server/auth/session";

export default async function DashboardHomePage() {
  const usuario = await getCurrentUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Bienvenido, {usuario?.nombre}
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        El panel de control con el estado de los contratos se construye en una fase posterior.
      </p>
    </div>
  );
}
