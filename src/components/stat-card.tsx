import { cn } from "cn";

type Tono = "neutral" | "success" | "warning" | "destructive";

const TONO_VALOR: Record<Tono, string> = {
  neutral: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

export function StatCard({
  label,
  value,
  hint,
  tono = "neutral",
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  tono?: Tono;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className={cn("text-2xl font-semibold tabular-nums", TONO_VALOR[tono])}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
