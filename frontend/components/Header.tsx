"use client";

// components/Header.tsx
// Dos variantes de encabezado usadas en las 9 pantallas protegidas,
// replicando el wireframe aprobado:
//  - <IdentityHeader>: avatar + nombre + rol/complejo + ayuda + cerrar sesión
//    (las 4 pantallas "Home" de cada rol).
//  - <SectionHeader>: título + ayuda (+ volver opcional), usada en las
//    sub-pantallas (Precios, Dashboard, Nueva reserva, etc.).

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { HelpBanner, HelpButton, useHelpToggle } from "./HelpBanner";

function LogoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 17l5-5-5-5M20 12H9M12 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface IdentityHeaderProps {
  nombre: string;
  subtitulo: string;
  iniciales: string;
  ayuda?: ReactNode;
}

export function IdentityHeader({ nombre, subtitulo, iniciales, ayuda }: IdentityHeaderProps) {
  const help = useHelpToggle();
  const { logout } = useAuth();

  return (
    <>
      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div className="avatar">{iniciales}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>{nombre}</div>
            <div className="text-muted" style={{ fontSize: 13 }}>
              {subtitulo}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {ayuda && <HelpButton onClick={help.toggle} />}
          <button
            type="button"
            aria-label="Cerrar sesión"
            onClick={logout}
            className="btn-icon"
            style={{ color: "var(--ink)" }}
          >
            <LogoutIcon />
          </button>
        </div>
      </header>
      {ayuda && <HelpBanner abierto={help.abierto}>{ayuda}</HelpBanner>}
    </>
  );
}

interface SectionHeaderProps {
  titulo: string;
  backHref?: string;
  iniciales?: string;
  ayuda?: ReactNode;
}

export function SectionHeader({ titulo, backHref, iniciales, ayuda }: SectionHeaderProps) {
  const help = useHelpToggle();

  return (
    <>
      <header className="app-header">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Volver"
            className="btn-icon"
            style={{ textDecoration: "none" }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        )}
        <h1 style={{ fontSize: 24, margin: 0, flex: 1 }}>{titulo}</h1>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {ayuda && <HelpButton onClick={help.toggle} />}
          {iniciales && (
            <div className="avatar" style={{ width: 40, height: 40, fontSize: 14 }}>
              {iniciales}
            </div>
          )}
        </div>
      </header>
      {ayuda && <HelpBanner abierto={help.abierto}>{ayuda}</HelpBanner>}
    </>
  );
}