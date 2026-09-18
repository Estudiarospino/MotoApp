import { Bike } from "lucide-react";
import { cn } from "cn";

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <Bike className="size-5" />
      </span>
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-base font-bold text-sidebar-foreground">MotoGestión</p>
          <p className="truncate text-[11px] text-sidebar-foreground/55">
            Arrendamiento con opción de compra
          </p>
        </div>
      )}
    </div>
  );
}
