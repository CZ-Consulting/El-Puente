"use client";

// components/BottomNav.tsx
// Nav inferior sticky, igual en las 4 "home" de cada rol y sus sub-pantallas.
// "Cuenta" cierra sesión (en el wireframe apuntaba directo al login).

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { IconCuenta } from "./icons";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { logout } = useAuth();

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
      <button type="button" onClick={logout} className="nav-item">
        <IconCuenta />
        Cuenta
      </button>
    </nav>
  );
}