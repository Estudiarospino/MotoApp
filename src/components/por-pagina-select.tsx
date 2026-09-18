"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const OPCIONES = [10, 25, 50];

export function PorPaginaSelect({
  basePath,
  query,
  valor,
}: {
  basePath: string;
  query: Record<string, string>;
  valor: number;
}) {
  const router = useRouter();

  function navegar(porPagina: string) {
    const params = new URLSearchParams(query);
    params.set("porPagina", porPagina);
    params.set("page", "1");
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <Select value={valor.toString()} onValueChange={(v) => navegar(v as string)}>
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPCIONES.map((o) => (
          <SelectItem key={o} value={o.toString()}>
            {o} por página
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
