"use client";

// components/BottomNav.tsx
// Nav inferior sticky, igual en las 4 "home" de cada rol y sus sub-pantallas.
// "Cuenta" lleva a /admin/cuenta (cambiar contraseña / cerrar sesión /
// contactar soporte). Antes cerraba la sesión directo al tocarlo (así estaba
// en el wireframe original), pero el cliente pidió agregarle opciones.

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { IconCuenta } from "./icons";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const CUENTA_HREF = "/admin/cuenta";

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="bottom-nav">
      {items.map((item) => {
        const activo = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${activo ? "nav-item-active" : ""}`}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
      <Link
        href={CUENTA_HREF}
        className={`nav-item ${pathname === CUENTA_HREF ? "nav-item-active" : ""}`}
      >
        <IconCuenta />
        Cuenta
      </Link>
    </nav>
  );
}