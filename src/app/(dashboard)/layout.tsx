import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { logout } from "./actions";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/clientes", label: "Clientes" },
  { href: "/motos", label: "Motos" },
  { href: "/contratos", label: "Contratos" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getCurrentUser();
  if (!usuario) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
        <nav className="flex gap-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-zinc-900 dark:hover:text-zinc-100">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <span>{usuario.nombre}</span>
          <form action={logout}>
            <button type="submit" className="font-medium text-zinc-900 hover:underline dark:text-zinc-100">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <main className="flex flex-1 flex-col p-6">{children}</main>
    </div>
  );
}
