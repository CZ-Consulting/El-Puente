"use client";

// app/admin/preparador/page.tsx — Bienvenida del Preparador
//
// El visualizador operativo se movió a /admin/preparador/visualizador (antes
// "Inicio" en la nav apuntaba a la misma pantalla en la que ya se estaba
// parado, y tocarlo no parecía hacer nada). Pantalla mínima: saludo + acceso
// directo, siguiendo el mismo patrón que el Home de AdminComplejo.

import Link from "next/link";
import { iniciales } from "@/lib/texto";
import { useAuth } from "@/contexts/AuthContext";
import { IdentityHeader } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SUBTITULO_POR_ROL, navItemsPorRol } from "@/lib/navegacionPorRol";
import { IconFlechaDerecha } from "@/components/icons";

export default function BienvenidaPreparadorPage() {
  const { usuario } = useAuth();

  if (!usuario) return null;

  return (
    <div className="app-shell">
      <IdentityHeader
        nombre={usuario.nombre}
        subtitulo={SUBTITULO_POR_ROL[usuario.rol]}
        iniciales={iniciales(usuario.nombre)}
        ayuda="Desde acá accedés al visualizador de canchas en tiempo real."
      />

      <main className="app-main">
        <h1 style={{ fontSize: 26, margin: "4px 0 0 0" }}>Hola, {usuario.nombre.split(" ")[0]}</h1>
        <p className="text-muted" style={{ margin: 0, fontSize: 15 }}>
          ¿Qué querés hacer?
        </p>

        <nav style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 4 }}>
          <Link href="/admin/preparador/visualizador" style={{ textDecoration: "none" }}>
            <div
              className="card"
              style={{ padding: 17, display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span style={{ fontWeight: 600, fontSize: 15.5, color: "var(--ink)" }}>Ver canchas ahora</span>
              <span className="text-muted">
                <IconFlechaDerecha />
              </span>
            </div>
          </Link>
        </nav>
      </main>

      <BottomNav items={navItemsPorRol(usuario.rol)} />
    </div>
  );
}