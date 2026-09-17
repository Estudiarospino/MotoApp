import "server-only";
import { cookies } from "next/headers";
import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "mt_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

const usuarioSeguro = {
  id: true,
  email: true,
  nombre: true,
  rol: true,
  activo: true,
} as const;

export type UsuarioActual = {
  id: string;
  email: string;
  nombre: string;
  rol: "ADMIN";
  activo: boolean;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(usuarioId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.sesion.create({
    data: { usuarioId, tokenHash: hashToken(token), expiresAt },
  });

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    await prisma.sesion.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  cookieStore.delete(COOKIE_NAME);
}

/** Lee la sesión actual. No lanza ni redirige — el layout protegido decide qué hacer con `null`. */
export async function getCurrentUser(): Promise<UsuarioActual | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const sesion = await prisma.sesion.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { expiresAt: true, usuario: { select: usuarioSeguro } },
  });

  if (!sesion || sesion.expiresAt < new Date() || !sesion.usuario.activo) {
    return null;
  }

  return sesion.usuario;
}
