import {
  BarChart3,
  Bike,
  ClipboardList,
  HandCoins,
  Home,
  Receipt,
  Settings,
  UserCog,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavChild = { label: string; href: string };
export type NavItem = { label: string; href: string; icon: LucideIcon; children?: NavChild[] };
export type NavSection = { label: string; items: NavItem[] };

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Principal",
    items: [
      { label: "Inicio", href: "/", icon: Home },
      {
        label: "Clientes",
        href: "/clientes",
        icon: Users,
        children: [
          { label: "Ver todos", href: "/clientes" },
          { label: "Nuevo cliente", href: "/clientes?nuevo=1" },
        ],
      },
      {
        label: "Motocicletas",
        href: "/motos",
        icon: Bike,
        children: [
          { label: "Ver todas", href: "/motos" },
          { label: "Nueva moto", href: "/motos?nuevo=1" },
        ],
      },
      {
        label: "Contratos",
        href: "/contratos",
        icon: ClipboardList,
        children: [
          { label: "Ver todos", href: "/contratos" },
          { label: "Nuevo contrato", href: "/contratos?nuevo=1" },
        ],
      },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { label: "Pagos y recibos", href: "/pagos", icon: Receipt },
      {
        label: "Gastos",
        href: "/gastos",
        icon: Wrench,
        children: [
          { label: "Ver todos", href: "/gastos" },
          { label: "Nuevo gasto", href: "/gastos?nuevo=1" },
        ],
      },
      {
        label: "Préstamos",
        href: "/prestamos",
        icon: HandCoins,
        children: [
          { label: "Ver todos", href: "/prestamos" },
          { label: "Nuevo préstamo", href: "/prestamos?nuevo=1" },
        ],
      },
    ],
  },
  {
    label: "Reportes",
    items: [
      { label: "Estadísticas", href: "/estadisticas", icon: BarChart3 },
      { label: "Reportes", href: "/reportes", icon: ClipboardList },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Configuración", href: "/configuracion", icon: Settings },
      { label: "Usuarios", href: "/usuarios", icon: UserCog },
    ],
  },
];
