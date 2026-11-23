"use client";

// components/HelpBanner.tsx
// El "banner de ayuda" colapsable que aparece en todas las pantallas del
// wireframe (botón "?" en el header + texto explicativo opcional).

import { useState, type ReactNode } from "react";

export function useHelpToggle() {
  const [abierto, setAbierto] = useState(false);
  return { abierto, toggle: () => setAbierto((v) => !v) };
}

export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" aria-label="Ayuda" onClick={onClick} className="btn-icon">
      ?
    </button>
  );
}

export function HelpBanner({ abierto, children }: { abierto: boolean; children: ReactNode }) {
  if (!abierto) return null;
  return (
    <div className="help-banner">
      <span style={{ fontWeight: 700, color: "var(--accent)", fontSize: 16 }}>?</span>
      <p>{children}</p>
    </div>
  );
}