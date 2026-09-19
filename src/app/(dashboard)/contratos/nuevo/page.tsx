import { redirect } from "next/navigation";

export default async function NuevoContratoPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string; renegociarDe?: string }>;
}) {
  const { clienteId, renegociarDe } = await searchParams;
  const params = new URLSearchParams({ nuevo: "1" });
  if (clienteId) params.set("clienteId", clienteId);
  if (renegociarDe) params.set("renegociarDe", renegociarDe);
  redirect(`/contratos?${params.toString()}`);
}
