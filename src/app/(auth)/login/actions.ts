"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/session";
import { estaBloqueado, limpiarIntentos, registrarIntentoFallido } from "@/server/auth/rateLimiter";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1),
});

// Hash de relleno (de un valor aleatorio, no de una contraseña real) para que
// verificar contra un email inexistente tome el mismo tiempo que uno real —
// evita que la respuesta filtre por temporización si el correo existe o no.
const HASH_RELLENO =
  "$argon2id$v=19$m=65536,p=4,t=3$SH0Jjx7tJEa5NR/WUx4TQg$/b0gcK1s7Tumj7ahip8rsL9To8uNlV1o5QRlcV5VEDk";

export async function login(formData: FormData): Promise<void> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=1");
  }

  const { email, password } = parsed.data;

  if (estaBloqueado(email)) {
    redirect("/login?error=bloqueado");
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  const claveValida = await verifyPassword(usuario?.passwordHash ?? HASH_RELLENO, password);
  const valido = Boolean(usuario?.activo) && claveValida;

  if (!valido || !usuario) {
    registrarIntentoFallido(email);
    redirect("/login?error=1");
  }

  limpiarIntentos(email);
  await createSession(usuario.id);
  redirect("/");
}
