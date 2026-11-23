"use client";

// components/SelectorFecha.tsx — botón cuadrado (mismo estilo que el "?" de
// ayuda) que abre el selector nativo de fecha, para saltar directo a un día
// en los visualizadores de canchas, sin tener que recorrer horario por
// horario con las flechas "< >" para llegar a otro día.

import { useRef } from "react";
import { IconCalendario } from "@/components/icons";

export function SelectorFecha({ fecha, onChange }: { fecha: string; onChange: (fecha: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  function abrir() {
    const el = inputRef.current;
    if (!el) return;
    // showPicker() es lo moderno (Chrome/Edge/Android), pero no está en
    // todos los navegadores todavía -- el fallback de focus()+click() es la
    // forma clásica de abrir el picker nativo de un input oculto.
    if (typeof el.showPicker === "function") {
      el.showPicker();
    } else {
      el.focus();
      el.click();
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <button type="button" aria-label="Elegir día" onClick={abrir} className="btn-icon">
        <IconCalendario />
      </button>
      <input
        ref={inputRef}
        type="date"
        value={fecha}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}