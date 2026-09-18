import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import {
  estadoVencimiento,
  VIGENCIA_SOAT_MESES,
  VIGENCIA_TECNOMECANICA_MESES,
} from "@/lib/moto-documentos";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type MotoDocumentos = {
  id: string;
  placa: string;
  soatFechaExpedicion: Date | null;
  tecnomecanicaFechaExpedicion: Date | null;
};

export function VehicleDocsAttention({ motos }: { motos: MotoDocumentos[] }) {
  const filas = motos
    .flatMap((moto) => {
      const soat = estadoVencimiento(moto.soatFechaExpedicion, VIGENCIA_SOAT_MESES);
      const tecno = estadoVencimiento(moto.tecnomecanicaFechaExpedicion, VIGENCIA_TECNOMECANICA_MESES);
      const items = [];
      if (soat.variant === "destructive" || soat.variant === "warning") {
        items.push({ moto, documento: "SOAT", estado: soat });
      }
      if (tecno.variant === "destructive" || tecno.variant === "warning") {
        items.push({ moto, documento: "Tecnomecánica", estado: tecno });
      }
      return items;
    })
    .sort((a, b) => (a.estado.vencimiento?.getTime() ?? 0) - (b.estado.vencimiento?.getTime() ?? 0));

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>SOAT y tecnomecánica</CardTitle>
        <Link href="/motos" className="text-xs font-medium text-primary hover:underline">
          Ver flota
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {filas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <ShieldAlert className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Ninguna moto activa tiene documentos vencidos o por vencer.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filas.map(({ moto, documento, estado }) => (
              <Link
                key={`${moto.id}-${documento}`}
                href={`/motos/${moto.id}`}
                className="flex items-center justify-between rounded-lg px-1 py-1 text-sm hover:bg-muted"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{moto.placa}</p>
                  <p className="text-xs text-muted-foreground">{documento}</p>
                </div>
                <Badge variant={estado.variant}>{estado.label}</Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
