"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bike, ClipboardList, Menu, Users, Home as HomeIcon } from "lucide-react";
import { cn } from "cn";

const TABS = [
  { label: "Inicio", href: "/", icon: HomeIcon },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Motos", href: "/motos", icon: Bike },
  { label: "Contratos", href: "/contratos", icon: ClipboardList },
];

function esRutaActiva(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileTabBar({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch border-t border-border bg-background lg:hidden print:hidden">
      {TABS.map((tab) => {
        const active = esRutaActiva(pathname, tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground",
              active && "text-primary",
            )}
          >
            <tab.icon className="size-5" />
            {tab.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onMore}
        className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground"
      >
        <Menu className="size-5" />
        Más
      </button>
    </nav>
  );
}
