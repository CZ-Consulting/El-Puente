"use client";

// app/admin/recepcion/page.tsx — Bienvenida del Recepcionista
//
// El visualizador de canchas en vivo se movió a /admin/recepcion/visualizador
// (así "Inicio" en la nav inferior tiene a dónde llevar: antes apuntaba a la
// misma pantalla del visualizador en la que ya se estaba parado, y tocar
// "Inicio" no parecía hacer nada). Esta pantalla replica el mismo patrón que
// ya usa el Home de AdminComplejo: saludo + accesos directos.
//
// Encabezado y nav inferior dinámicos según el rol real (navegacionPorRol),
// por si un AdminComplejo o SuperAdmin llegan hasta acá.

import Link from "next/link";
import { iniciales } from "@/lib/texto";
import { useAuth } from "@/contexts/AuthContext";
import { IdentityHeader } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SUBTITULO_POR_ROL, navItemsPorRol } from "@/lib/navegacionPorRol";
import { IconFlechaDerecha } from "@/components/icons";

export default function BienvenidaRecepcionPage() {
  const { usuario } = useAuth();

  if (!usuario) return null;

  return (
    <div className="app-shell">
      <IdentityHeader
        nombre={usuario.nombre}
        subtitulo={SUBTITULO_POR_ROL[usuario.rol]}
        iniciales={iniciales(usuario.nombre)}
        ayuda='Desde acá accedés al visualizador de canchas en tiempo real o cargás una reserva nueva.'
      />

      <main className="app-main">
        <h1 style={{ fontSize: 26, margin: "4px 0 0 0" }}>Hola, {usuario.nombre.split(" ")[0]}</h1>
        <p className="text-muted" style={{ margin: 0, fontSize: 15 }}>
          ¿Qué querés hacer?
        </p>

        <nav style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 4 }}>
          <Link href="/admin/recepcion/visualizador" style={{ textDecoration: "none" }}>
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
          <Link href="/admin/recepcion/nueva" style={{ textDecoration: "none" }}>
            <div
              className="card"
              style={{ padding: 17, display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span style={{ fontWeight: 600, fontSize: 15.5, color: "var(--ink)" }}>Cargar nueva reserva</span>
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