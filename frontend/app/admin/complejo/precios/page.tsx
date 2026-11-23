"use client";

// app/admin/complejo/precios/page.tsx — réplica de Precios.dc.html
//
// El Admin de Complejo solo puede tocar el precio por hora de cada tipo de
// cancha (nunca la estructura) — por eso pega a PATCH /tipos-cancha/{id}/precio
// y no al PUT completo, que es exclusivo de SuperAdmin.

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { iniciales } from "@/lib/texto";
import { useAuth } from "@/contexts/AuthContext";
import { SectionHeader } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { IconInicio, IconDashboard, IconPrecios } from "@/components/icons";

interface TipoCanchaListado {
  id: string;
  nombre: string;
  jugadoresPorEquipo: number;
  precioPorHora: number;
  activo: boolean;
}

const NAV_ITEMS = [
  { href: "/admin/complejo", label: "Inicio", icon: <IconInicio /> },
  { href: "/admin/complejo/dashboard", label: "Dashboard", icon: <IconDashboard /> },
  { href: "/admin/complejo/precios", label: "Precios", icon: <IconPrecios /> },
];

export default function PreciosPage() {
  const { usuario } = useAuth();
  const [tipos, setTipos] = useState<TipoCanchaListado[]>([]);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .get<TipoCanchaListado[]>("/api/tipos-cancha")
      .then((data) => {
        setTipos(data);
        const valoresIniciales: Record<string, string> = {};
        data.forEach((t) => (valoresIniciales[t.id] = String(t.precioPorHora)));
        setValores(valoresIniciales);
      })
      .finally(() => setCargando(false));
  }, []);

  async function guardar(id: string) {
    const precio = Number(valores[id]);
    if (Number.isNaN(precio) || precio < 0) {
      setMensaje((m) => ({ ...m, [id]: "Precio inválido." }));
      return;
    }
    setGuardando(id);
    setMensaje((m) => ({ ...m, [id]: "" }));
    try {
      await api.patch(`/api/tipos-cancha/${id}/precio`, { precioPorHora: precio });
      setMensaje((m) => ({ ...m, [id]: "Guardado." }));
    } catch (err) {
      setMensaje((m) => ({ ...m, [id]: err instanceof ApiError ? err.message : "No se pudo guardar." }));
    } finally {
      setGuardando(null);
    }
  }

  return (
    <div className="app-shell">
      <SectionHeader
        titulo="Precios"
        iniciales={usuario ? iniciales(usuario.nombre) : undefined}
        ayuda='Cambiá el valor por hora de cada tipo de cancha y tocá "Guardar". El tipo de cancha en sí (cuántas hay, cómo se combinan) lo gestiona el administrador del sistema.'
      />

      <main className="app-main">
        <p className="text-muted" style={{ fontSize: 15, margin: 0 }}>
          Definí cuánto cobrás por hora en cada tipo de cancha.
        </p>

        {cargando ? (
          <p className="cargando">Cargando...</p>
        ) : (
          tipos.map((t) => (
            <div key={t.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{t.nombre}</div>
                <div className="text-muted" style={{ fontSize: 13.5 }}>
                  {t.jugadoresPorEquipo} jugadores por partido
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  type="number"
                  min="0"
                  className="input"
                  style={{ flex: 1, fontWeight: 600 }}
                  value={valores[t.id] ?? ""}
                  onChange={(e) => setValores((v) => ({ ...v, [t.id]: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => guardar(t.id)}
                  disabled={guardando === t.id}
                  style={{
                    background: "var(--accent-fill)",
                    color: "var(--on-accent)",
                    border: "none",
                    borderRadius: 14,
                    padding: "0 20px",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                  }}
                >
                  {guardando === t.id ? "..." : "Guardar"}
                </button>
              </div>
              {mensaje[t.id] && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: mensaje[t.id] === "Guardado." ? "var(--ok)" : "var(--warn)",
                  }}
                >
                  {mensaje[t.id]}
                </p>
              )}
            </div>
          ))
        )}
      </main>

      <BottomNav items={NAV_ITEMS} />
    </div>
  );
}