import { redirect } from "next/navigation";

export default function NuevaMotoPage() {
  redirect("/motos?nuevo=1");
}
