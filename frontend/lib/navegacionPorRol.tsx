// lib/navegacionPorRol.tsx
//
// Algunas pantallas (el visualizador de canchas, la pantalla de Cuenta) son
// compartidas por varios roles: AdminComplejo y SuperAdmin pueden entrar a
// "Ver canchas ahora" igual que un Recepcionista o un Preparador. Esas
// pantallas NO deben hardcodear "soy Recepcionista" ni la nav de un rol fijo
// — tienen que mostrar el identificador y la navegación inferior según el
// rol REAL del usuario logueado (usuario.rol), para no mostrarle a un
// AdminComplejo que está viendo la app como si fuera otro rol.

import type { ReactNode } from "react";
import type { Rol } from "@/contexts/AuthContext";
import {
  IconInicio,
  IconReservas,
  IconDashboard,
  IconPrecios,
  IconConfiguracion,
} from "@/components/icons";
import type { NavItem } from "@/components/BottomNav";

export const SUBTITULO_POR_ROL: Record<Rol, string> = {
  SuperAdmin: "Super Admin",
  AdminComplejo: "Admin de Complejo",
  Recepcionista: "Recepcionista",
  Preparador: "Preparador",
};

export const HOME_POR_ROL: Record<Rol, string> = {
  SuperAdmin: "/admin/superadmin",
  AdminComplejo: "/admin/complejo",
  Recepcionista: "/admin/recepcion",
  Preparador: "/admin/preparador",
};

export function navItemsPorRol(rol: Rol): NavItem[] {
  switch (rol) {
    case "SuperAdmin":
      return [
        { href: "/admin/superadmin", label: "Complejos", icon: <IconInicio /> as ReactNode },
        {
          href: "/admin/superadmin/configuracion",
          label: "Configuración",
          icon: <IconConfiguracion /> as ReactNode,
        },
      ];
    case "AdminComplejo":
      return [
        { href: "/admin/complejo", label: "Inicio", icon: <IconInicio /> as ReactNode },
        { href: "/admin/complejo/dashboard", label: "Dashboard", icon: <IconDashboard /> as ReactNode },
        { href: "/admin/complejo/precios", label: "Precios", icon: <IconPrecios /> as ReactNode },
      ];
    case "Recepcionista":
      return [
        { href: "/admin/recepcion", label: "Inicio", icon: <IconInicio /> as ReactNode },
        { href: "/admin/recepcion/nueva", label: "Reservas", icon: <IconReservas /> as ReactNode },
      ];
    case "Preparador":
    default:
      return [{ href: "/admin/preparador", label: "Inicio", icon: <IconInicio /> as ReactNode }];
  }
}