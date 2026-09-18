import { BarChart3 } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function EstadisticasPage() {
  return (
    <ComingSoon
      icon={BarChart3}
      title="Estadísticas"
      description="Métricas históricas y tendencias del negocio."
    />
  );
}
