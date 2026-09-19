import { redirect } from "next/navigation";

export default function NuevoPrestamoPage() {
  redirect("/prestamos?nuevo=1");
}
