import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-6" />
          </span>
          <p className="text-sm font-medium text-foreground">Próximamente</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Esta sección está en construcción y llegará en una próxima actualización.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
