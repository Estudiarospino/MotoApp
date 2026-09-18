"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bell, Bike, ChevronDown, LogOut, Menu, Search } from "lucide-react";
import { cn } from "cn";
import { useHeaderOverride } from "./header-context";

const formatoFecha = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function Header({
  usuario,
  notificaciones,
  onToggleSidebar,
  onLogout,
}: {
  usuario: { nombre: string; email: string };
  notificaciones: number;
  onToggleSidebar: () => void;
  onLogout: () => void | Promise<void>;
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const { override } = useHeaderOverride();

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuAbierto(false);
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const fecha = capitalizar(formatoFecha.format(new Date()));
  const iniciales = usuario.nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-4 sm:px-6 print:hidden">
      {override && (
        <Link
          href={override.backHref}
          aria-label="Volver"
          className="flex min-w-0 flex-1 items-center gap-2.5 sm:hidden"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
            <ArrowLeft className="size-5" />
          </span>
          <span className="truncate font-semibold text-foreground">{override.title}</span>
        </Link>
      )}

      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Alternar menú de navegación"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground",
          override && "hidden sm:flex",
        )}
      >
        <Menu className="size-5" />
      </button>

      <Link href="/" className={cn("flex items-center gap-1.5 sm:hidden", override && "hidden")}>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar text-sidebar-primary-foreground">
          <Bike className="size-4" />
        </span>
        <span className="text-sm font-bold text-foreground">
          Moto<span className="text-primary">Gestión</span>
        </span>
      </Link>

      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Buscar clientes, motos, contratos..."
          className="h-9 w-full rounded-lg border border-border bg-muted/40 pr-14 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <kbd className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          Ctrl+K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
        <Link
          href="/contratos"
          aria-label="Contratos que necesitan atención"
          className="relative flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Bell className="size-5" />
          {notificaciones > 0 && (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
              {notificaciones > 9 ? "9+" : notificaciones}
            </span>
          )}
        </Link>

        <div className="hidden text-right text-xs leading-tight text-muted-foreground md:block">
          <p className="font-medium text-foreground">{fecha}</p>
          <p>Santa Marta, Colombia</p>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg py-1 pr-1 pl-1 hover:bg-muted"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {iniciales || "?"}
            </span>
            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", menuAbierto && "rotate-180")} />
          </button>

          {menuAbierto && (
            <div className="absolute right-0 z-40 mt-2 w-56 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-lg">
              <div className="px-2.5 py-2">
                <p className="truncate text-sm font-medium">{usuario.nombre}</p>
                <p className="truncate text-xs text-muted-foreground">{usuario.email}</p>
              </div>
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                onClick={() => {
                  setMenuAbierto(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
