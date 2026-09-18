"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileTabBar } from "./mobile-tabbar";
import { HeaderOverrideProvider } from "./header-context";

const BREAKPOINT_LG = 1024;

export function DashboardShell({
  usuario,
  notificaciones,
  onLogout,
  children,
}: {
  usuario: { nombre: string; email: string };
  notificaciones: number;
  onLogout: () => void | Promise<void>;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleSidebar() {
    const esEscritorio = window.matchMedia(`(min-width: ${BREAKPOINT_LG}px)`).matches;
    if (esEscritorio) {
      setCollapsed((v) => !v);
    } else {
      setMobileOpen((v) => !v);
    }
  }

  return (
    <HeaderOverrideProvider>
      <div className="flex min-h-dvh w-full bg-background">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          usuario={usuario}
          onLogout={onLogout}
        />

        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <Header
            usuario={usuario}
            notificaciones={notificaciones}
            onToggleSidebar={toggleSidebar}
            onLogout={onLogout}
          />
          <main className="flex flex-1 flex-col p-4 pb-20 sm:p-6 lg:pb-6">{children}</main>
          <footer className="hidden flex-col items-center gap-1 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:flex sm:flex-row sm:justify-between sm:px-6 print:hidden">
            <p>MotoGestión v1.0.0 · Arrendamiento de motocicletas con opción de compra</p>
            <p className="flex items-center gap-1.5">
              Hecho en Colombia <span aria-hidden>🇨🇴</span>
            </p>
          </footer>
        </div>

        <MobileTabBar onMore={() => setMobileOpen(true)} />
      </div>
    </HeaderOverrideProvider>
  );
}
