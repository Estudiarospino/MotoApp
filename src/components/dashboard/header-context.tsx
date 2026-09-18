"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type HeaderOverride = { title: string; backHref: string } | null;

const HeaderOverrideContext = createContext<{
  override: HeaderOverride;
  setOverride: (override: HeaderOverride) => void;
} | null>(null);

export function HeaderOverrideProvider({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<HeaderOverride>(null);
  return (
    <HeaderOverrideContext.Provider value={{ override, setOverride }}>{children}</HeaderOverrideContext.Provider>
  );
}

export function useHeaderOverride() {
  const ctx = useContext(HeaderOverrideContext);
  if (!ctx) throw new Error("useHeaderOverride debe usarse dentro de HeaderOverrideProvider");
  return ctx;
}
