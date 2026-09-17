"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { parseClienteFormData } from "@/lib/validation/cliente";

export type ClienteFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function esViolacionUnica(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createCliente(
  _prevState: ClienteFormState,
  formData: FormData,
): Promise<ClienteFormState> {
  const parsed = parseClienteFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }

  try {
    await prisma.cliente.create({ data: parsed.data });
  } catch (error) {
    if (esViolacionUnica(error)) {
      return { error: "Ya existe un cliente con ese número de identificación." };
    }
    throw error;
  }

  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function updateCliente(
  id: string,
  _prevState: ClienteFormState,
  formData: FormData,
): Promise<ClienteFormState> {
  const parsed = parseClienteFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }

  try {
    await prisma.cliente.update({ where: { id }, data: parsed.data });
  } catch (error) {
    if (esViolacionUnica(error)) {
      return { error: "Ya existe un cliente con ese número de identificación." };
    }
    throw error;
  }

  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function toggleActivoCliente(id: string): Promise<void> {
  const cliente = await prisma.cliente.findUniqueOrThrow({
    where: { id },
    select: { activo: true },
  });

  await prisma.cliente.update({ where: { id }, data: { activo: !cliente.activo } });
  revalidatePath("/clientes");
}
