"use client";

// components/RequireRol.tsx
//
// Segunda capa de protección de rutas (la primera es middleware.ts, que solo
// chequea "¿hay sesión?"). Esta decide "¿esta sesión tiene el rol correcto
// para esta pantalla?" — se usa en el layout.tsx de cada subcarpeta de
// app/admin/<rol>/. Es una capa de UX, no de seguridad real: la seguridad
// real sigue siendo el backend (401/403/RLS), esto solo evita que, por
// ejemplo, un Preparador vea por error una pantalla de otro rol navegando a
// mano la URL.

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type Rol } from "@/contexts/AuthContext";

interface Props {
  roles: Rol[];
  children: ReactNode;
}

export function RequireRol({ roles, children }: Props) {
  const { usuario, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;
    // Sin usuario y sin estar cargando: el token no era válido. El propio
    // AuthContext/api.ts ya debería haber limpiado la cookie; por las dudas,
    // mandamos al login.
    if (!usuario) {
      router.replace("/login");
      return;
    }
    if (!roles.includes(usuario.rol)) {
      router.replace("/");
    }
  }, [cargando, usuario, roles, router]);

  if (cargando) return <p className="cargando">Cargando...</p>;
  if (!usuario || !roles.includes(usuario.rol)) return null;

  return <>{children}</>;
}