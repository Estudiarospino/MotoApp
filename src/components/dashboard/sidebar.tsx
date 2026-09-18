"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Crown, LogOut } from "lucide-react";
import { cn } from "cn";
import { Logo } from "./logo";
import { NAV_SECTIONS, type NavItem } from "./nav-data";

function esRutaActiva(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function contieneRutaActiva(pathname: string, item: NavItem): boolean {
  if (esRutaActiva(pathname, item.href)) return true;
  return item.children?.some((child) => esRutaActiva(pathname, child.href)) ?? false;
}

function NavLink({
  item,
  collapsed,
  active,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(() => contieneRutaActiva(pathname, item));
  const Icon = item.icon;
  const tieneHijos = !collapsed && !!item.children?.length;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
          active && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary",
          collapsed && "justify-center px-0",
        )}
      >
        <Link
          href={item.href}
          onClick={onNavigate}
          title={collapsed ? item.label : undefined}
          className="flex min-w-0 flex-1 items-center gap-2.5"
        >
          <Icon className="size-[18px] shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>
        {tieneHijos && (
          <button
            type="button"
            aria-label={abierto ? `Contraer ${item.label}` : `Expandir ${item.label}`}
            onClick={() => setAbierto((v) => !v)}
            className="shrink-0 rounded p-0.5 text-current/70 hover:text-current"
          >
            <ChevronRight className={cn("size-3.5 transition-transform", abierto && "rotate-90")} />
          </button>
        )}
      </div>

      {tieneHijos && abierto && (
        <div className="mt-0.5 ml-[26px] flex flex-col gap-0.5 border-l border-sidebar-border pl-3.5">
          {item.children!.map((child) => {
            const childActive = esRutaActiva(pathname, child.href);
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={cn(
                  "truncate rounded-md px-2.5 py-1.5 text-[13px] text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  childActive && "text-sidebar-foreground font-medium",
                )}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  usuario,
  onLogout,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  usuario: { nombre: string; email: string };
  onLogout: () => void | Promise<void>;
}) {
  const pathname = usePathname();
  const iniciales = usuario.nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Cerrar menú"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 print:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed && "lg:w-[76px]",
        )}
      >
        <div className={cn("flex h-16 shrink-0 items-center px-4", collapsed && "lg:justify-center lg:px-2")}>
          <Logo collapsed={collapsed} />
        </div>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-2">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="flex flex-col gap-1">
              {!collapsed && (
                <p className="px-3 text-[10px] font-semibold tracking-wider text-sidebar-foreground/40 uppercase">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  active={esRutaActiva(pathname, item.href)}
                  onNavigate={onCloseMobile}
                />
              ))}
            </div>
          ))}
        </nav>

        {!collapsed && (
          <div className="mx-3 mb-3 rounded-xl bg-sidebar-accent p-3.5">
            <Crown className="size-5 text-sidebar-primary" />
            <p className="mt-2 text-[13px] leading-snug font-medium text-sidebar-foreground">
              Gestiona tu flota, haz crecer tu negocio
            </p>
          </div>
        )}

        <div className={cn("flex items-center gap-2.5 border-t border-sidebar-border px-4 py-3.5", collapsed && "lg:justify-center lg:px-2")}>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
            {iniciales || "?"}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{usuario.nombre}</p>
              <p className="truncate text-xs text-sidebar-foreground/50">{usuario.email}</p>
              <button
                type="button"
                onClick={onLogout}
                className="mt-0.5 flex items-center gap-1 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground"
              >
                <LogOut className="size-3" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
