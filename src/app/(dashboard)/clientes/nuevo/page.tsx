import { redirect } from "next/navigation";

export default function NuevoClientePage() {
  redirect("/clientes?nuevo=1");
}
