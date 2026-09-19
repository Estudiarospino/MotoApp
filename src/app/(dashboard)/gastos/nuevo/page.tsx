import { redirect } from "next/navigation";

export default async function NuevoGastoPage({
  searchParams,
}: {
  searchParams: Promise<{ motoId?: string }>;
}) {
  const { motoId } = await searchParams;
  const params = new URLSearchParams({ nuevo: "1" });
  if (motoId) params.set("motocicletaId", motoId);
  redirect(`/gastos?${params.toString()}`);
}
