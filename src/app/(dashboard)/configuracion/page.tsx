import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function ConfiguracionPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Configuración"
      description="Preferencias generales del negocio y del sistema."
    />
  );
}
