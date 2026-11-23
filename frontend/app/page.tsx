"use client";

// app/page.tsx
//
// Landing post-login: no es una pantalla en sí, redirige al Home de cada rol.
// (El middleware ya garantiza que si llegamos acá hay sesión; falta decidir
// A CUÁL Home mandar según el rol real que devolvió GET /api/auth/me.)

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type Rol } from "@/contexts/AuthContext";

const HOME_POR_ROL: Record<Rol, string> = {
  SuperAdmin: "/admin/superadmin",
  AdminComplejo: "/admin/complejo",
  Recepcionista: "/admin/recepcion",
  Preparador: "/admin/preparador",
};

export default function RaizPage() {
  const { usuario, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;
    if (!usuario) {
      router.replace("/login");
      return;
    }
    router.replace(HOME_POR_ROL[usuario.rol]);
  }, [cargando, usuario, router]);

  return <p className="cargando">Cargando...</p>;
}