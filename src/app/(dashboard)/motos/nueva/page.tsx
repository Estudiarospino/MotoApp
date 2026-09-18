import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MobilePageHeader } from "@/components/dashboard/mobile-page-header";
import { MotoForm } from "../moto-form";
import { createMotocicleta } from "../actions";

export default function NuevaMotoPage() {
  return (
    <div className="flex flex-col gap-4">
      <MobilePageHeader title="Nueva moto" backHref="/motos" />

      <nav className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>
        <ChevronRight className="size-3" />
        <Link href="/motos" className="hover:text-foreground">
          Motocicletas
        </Link>
        <ChevronRight className="size-3" />
        <span className="font-medium text-foreground">Nueva</span>
      </nav>

      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nueva moto</h1>
      <MotoForm action={createMotocicleta} />
    </div>
  );
}
