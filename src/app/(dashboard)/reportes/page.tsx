import { ClipboardList } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function ReportesPage() {
  return (
    <ComingSoon
      icon={ClipboardList}
      title="Reportes"
      description="Reportes exportables de cartera, gastos y préstamos."
    />
  );
}
