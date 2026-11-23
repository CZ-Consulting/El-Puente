"use client";

// app/admin/complejo/page.tsx — réplica de HomeAdminComplejo.dc.html
//
// Resumen del mes + accesos directos. El monto de "Recaudado" y la cantidad
// de reservas salen de GET /api/reportes/recaudacion (mes actual). El dato
// de "señas pendientes" del wireframe no tiene endpoint propio todavía (no
// hay un reporte de reservas con seña impaga agregadas) — queda marcado
// como pendiente en vez de inventarlo.

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { fechaHoyLocal } from "@/lib/tiempo";
import { formatoMoneda } from "@/lib/texto";
import { iniciales } from "@/lib/texto";
import { useAuth } from "@/contexts/AuthContext";
import { IdentityHeader } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { IconInicio, IconDashboard, IconPrecios, IconFlechaDerecha } from "@/components/icons";

interface RecaudacionDto {
  desde: string;
  hasta: string;
  total: number;
  cantidadReservas: number;
}

const NAV_ITEMS = [
  { href: "/admin/complejo", label: "Inicio", icon: <IconInicio /> },
  { href: "/admin/complejo/dashboard", label: "Dashboard", icon: <IconDashboard /> },
  { href: "/admin/complejo/precios", label: "Precios", icon: <IconPrecios /> },
];

function nombreMesActual(): string {
  return new Intl.DateTimeFormat("es-AR", { month: "long" }).format(new Date());
}

export default function HomeAdminComplejoPage() {
  const { usuario } = useAuth();
  const [recaudacion, setRecaudacion] = useState<RecaudacionDto | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const hoy = fechaHoyLocal();
    const primerDiaMes = `${hoy.slice(0, 7)}-01`;
    api
      .get<RecaudacionDto>("/api/reportes/recaudacion", { desde: primerDiaMes, hasta: hoy })
      .then(setRecaudacion)
      .finally(() => setCargando(false));
  }, []);

  if (!usuario) return null;

  return (
    <div className="app-shell">
      <IdentityHeader
        nombre={usuario.nombre}
        subtitulo="Admin de Complejo"
        iniciales={iniciales(usuario.nombre)}
        ayuda="Este es el resumen de tu complejo. Desde acá accedés al dashboard completo, a configurar tus precios y a ver las canchas en tiempo real."
      />

      <main className="app-main">
        <h1 style={{ fontSize: 26, margin: "4px 0 0 0" }}>Hoy, de un vistazo</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <div className="text-muted" style={{ fontSize: 14, fontWeight: 600 }}>
              Recaudado · {nombreMesActual()}
            </div>
            <div className="font-display" style={{ fontSize: 33, marginTop: 6 }}>
              {cargando ? "..." : formatoMoneda(recaudacion?.total ?? 0)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <div className="card" style={{ flex: 1, padding: 18 }}>
              <div className="text-muted" style={{ fontSize: 13.5, fontWeight: 600 }}>
                Reservas
              </div>
              <div className="font-display" style={{ fontSize: 24, marginTop: 4 }}>
                {cargando ? "..." : recaudacion?.cantidadReservas ?? 0}
              </div>
            </div>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 4 }}>
          <Link href="/admin/recepcion" style={{ textDecoration: "none" }}>
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
          <Link href="/admin/complejo/dashboard" style={{ textDecoration: "none" }}>
            <div
              className="card"
              style={{ padding: 17, display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span style={{ fontWeight: 600, fontSize: 15.5, color: "var(--ink)" }}>Ver dashboard completo</span>
              <span className="text-muted">
                <IconFlechaDerecha />
              </span>
            </div>
          </Link>
          <Link href="/admin/complejo/precios" style={{ textDecoration: "none" }}>
            <div
              className="card"
              style={{ padding: 17, display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span style={{ fontWeight: 600, fontSize: 15.5, color: "var(--ink)" }}>Configurar precios</span>
              <span className="text-muted">
                <IconFlechaDerecha />
              </span>
            </div>
          </Link>
        </nav>
      </main>

      <BottomNav items={NAV_ITEMS} />
    </div>
  );
}