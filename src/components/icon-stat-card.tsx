import Link from "next/link";
import { ChevronRight, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

type Tono = "neutral" | "success" | "warning" | "destructive";

const TONO_ICONO: Record<Tono, string> = {
  neutral: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export function IconStatCard({
  icon: Icon,
  label,
  value,
  hint,
  tono = "neutral",
  tendenciaPct,
  progreso,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tono?: Tono;
  tendenciaPct?: number | null;
  progreso?: number;
  href?: string;
}) {
  const contenido = (
    <Card className={cn(href && "transition-colors hover:bg-muted/40")}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <span className={cn("flex size-9 items-center justify-center rounded-lg", TONO_ICONO[tono])}>
            <Icon className="size-[18px]" />
          </span>
          {typeof tendenciaPct === "number" && (
            <span
              className={cn(
                "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
                tendenciaPct >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
              )}
            >
              {tendenciaPct >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {Math.abs(tendenciaPct)}%
            </span>
          )}
        </div>

        <div className="relative">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-foreground sm:text-2xl">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          {href && <ChevronRight className="absolute top-0 right-0 size-4 text-muted-foreground sm:hidden" />}
        </div>

        {typeof progreso === "number" && <Progress value={progreso} />}
      </CardContent>
    </Card>
  );

  return href ? (
    <Link href={href} className="block">
      {contenido}
    </Link>
  ) : (
    contenido
  );
}
