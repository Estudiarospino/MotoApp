"use client";

import { useEffect } from "react";
import { useHeaderOverride } from "./header-context";

/** Renderizado dentro de una página de detalle: en móvil cambia el header global por "‹ Título". */
export function MobilePageHeader({ title, backHref }: { title: string; backHref: string }) {
  const { setOverride } = useHeaderOverride();

  useEffect(() => {
    setOverride({ title, backHref });
    return () => setOverride(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, backHref]);

  return null;
}
