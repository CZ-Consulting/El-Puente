"use client";

// app/admin/complejo/dashboard/page.tsx — réplica de Dashboard.dc.html
//
// Periodos (día/semana/mes/trimestre/personalizado) resueltos en el
// FRONTEND calculando desde/hasta, contra el mismo endpoint genérico
// GET /api/reportes/recaudacion (tal como quedó documentado: "los presets
// los resuelve el frontend"). El desglose "por tipo de cancha" ahora viene
// en "porTipoCancha" (ObtenerRecaudacionAsync del backend lo agrega).

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { fechaHoyLocal } from "@/lib/tiempo";
import { formatoMoneda, iniciales } from "@/lib/texto";
import { useAuth } from "@/contexts/AuthContext";
import { SectionHeader } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { IconInicio, IconDashboard, IconPrecios } from "@/components/icons";

interface RecaudacionPorDia {
  fecha: string;
  total: number;
  cantidadReservas: number;
}

interface RecaudacionPorTipoCancha {
  tipoCanchaId: string;
  tipoCanchaNombre: string;
  total: number;
  cantidadReservas: number;
}

interface RecaudacionDto {
  desde: string;
  hasta: string;
  total: number;
  cantidadReservas: number;
  porDia: RecaudacionPorDia[];
  porTipoCancha: RecaudacionPorTipoCancha[];
}

type Periodo = "dia" | "semana" | "mes" | "trimestre" | "personalizado";

const NAV_ITEMS = [
  { href: "/admin/complejo", label: "Inicio", icon: <IconInicio /> },
  { href: "/admin/complejo/dashboard", label: "Dashboard", icon: <IconDashboard /> },
  { href: "/admin/complejo/precios", label: "Precios", icon: <IconPrecios /> },
];

// Con pocas barras (día/semana) el nombre del día ayuda más que el número;
// con muchas (mes/trimestre) el número de día es más legible que repetir
// nombres de día de semana.
function etiquetaDia(fecha: string, mostrarNombreDia: boolean): string {
  if (!mostrarNombreDia) return fecha.slice(8, 10);
  const nombre = new Intl.DateTimeFormat("es-AR", { weekday: "short", timeZone: "UTC" }).format(
    new Date(`${fecha}T00:00:00Z`),
  );
  return nombre.charAt(0).toUpperCase() + nombre.slice(1, 3);
}

function restarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00`);
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

function calcularRango(periodo: Periodo, hoy: string): { desde: string; hasta: string } {
  switch (periodo) {
    case "dia":
      return { desde: hoy, hasta: hoy };
    case "semana":
      return { desde: restarDias(hoy, 6), hasta: hoy };
    case "trimestre":
      return { desde: restarDias(hoy, 89), hasta: hoy };
    case "mes":
    default:
      return { desde: `${hoy.slice(0, 7)}-01`, hasta: hoy };
  }
}

export default function DashboardComplejoPage() {
  const { usuario } = useAuth();
  const hoy = fechaHoyLocal();

  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [desdePersonalizado, setDesdePersonalizado] = useState(restarDias(hoy, 29));
  const [hastaPersonalizado, setHastaPersonalizado] = useState(hoy);
  const [datos, setDatos] = useState<RecaudacionDto | null>(null);
  const [cargando, setCargando] = useState(true);

  const { desde, hasta } =
    periodo === "personalizado"
      ? { desde: desdePersonalizado, hasta: hastaPersonalizado }
      : calcularRango(periodo, hoy);

  useEffect(() => {
    setCargando(true);
    api
      .get<RecaudacionDto>("/api/reportes/recaudacion", { desde, hasta })
      .then(setDatos)
      .finally(() => setCargando(false));
  }, [desde, hasta]);

  const maximoDia = useMemo(
    () => Math.max(1, ...(datos?.porDia.map((d) => d.total) ?? [0])),
    [datos],
  );

  const chips: { id: Periodo; label: string }[] = [
    { id: "dia", label: "Día" },
    { id: "semana", label: "Semana" },
    { id: "mes", label: "Mes" },
    { id: "trimestre", label: "Trimestre" },
    { id: "personalizado", label: "Personalizado" },
  ];

  return (
    <div className="app-shell">
      <SectionHeader
        titulo="Dashboard"
        iniciales={usuario ? iniciales(usuario.nombre) : undefined}
        ayuda="Elegí un período (día, semana, mes, trimestre o un rango propio) para ver cuánto recaudó tu complejo."
      />

      <main className="app-main">
        <div className="scroll-x" style={{ display: "flex", gap: 8, paddingBottom: 4 }}>
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setPeriodo(c.id)}
              className={`chip ${periodo === c.id ? "chip-active" : ""}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {periodo === "personalizado" && (
          <div style={{ display: "flex", gap: 12 }}>
            <input
              type="date"
              className="input"
              value={desdePersonalizado}
              onChange={(e) => setDesdePersonalizado(e.target.value)}
            />
            <input
              type="date"
              className="input"
              value={hastaPersonalizado}
              onChange={(e) => setHastaPersonalizado(e.target.value)}
            />
          </div>
        )}

        <div className="card">
          <div className="text-muted" style={{ fontSize: 14, fontWeight: 600 }}>
            Recaudado
          </div>
          <div className="font-display" style={{ fontSize: 34, marginTop: 6 }}>
            {cargando ? "..." : formatoMoneda(datos?.total ?? 0)}
          </div>
        </div>

        <div className="card">
          <div className="text-muted" style={{ fontSize: 13.5, fontWeight: 600 }}>
            Reservas en el período
          </div>
          <div className="font-display" style={{ fontSize: 24, marginTop: 4 }}>
            {cargando ? "..." : datos?.cantidadReservas ?? 0}
          </div>
        </div>

        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Recaudación por día</div>
          {cargando || !datos || datos.porDia.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 14 }}>
              {cargando ? "Cargando..." : "Sin reservas confirmadas en este período."}
            </p>
          ) : (
            <div className="scroll-x" style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 130 }}>
              {datos.porDia.map((d) => (
                <div
                  key={d.fecha}
                  style={{
                    flex: "1 0 18px",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div
                    title={`${d.fecha}: ${formatoMoneda(d.total)}`}
                    style={{
                      width: "100%",
                      background: "var(--accent-fill)",
                      borderRadius: "6px 6px 0 0",
                      height: `${Math.max(6, (d.total / maximoDia) * 100)}%`,
                    }}
                  />
                  <span className="text-muted" style={{ fontSize: 10 }}>
                    {etiquetaDia(d.fecha, datos.porDia.length <= 7)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Desglose por tipo de cancha</div>
          {cargando || !datos || datos.porTipoCancha.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 14, margin: 0 }}>
              {cargando ? "Cargando..." : "Sin reservas confirmadas en este período."}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {datos.porTipoCancha.map((t) => (
                <div key={t.tipoCanchaId}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{t.tipoCanchaNombre}</span>
                    <span className="font-display" style={{ fontSize: 17 }}>
                      {formatoMoneda(t.total)}
                    </span>
                  </div>
                  <div
                    className="text-muted"
                    style={{ fontSize: 12.5, marginTop: 1 }}
                  >
                    {t.cantidadReservas} {t.cantidadReservas === 1 ? "reserva" : "reservas"}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      height: 8,
                      borderRadius: 4,
                      background: "var(--bg)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${datos.total > 0 ? (t.total / datos.total) * 100 : 0}%`,
                        background: "var(--accent-fill)",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav items={NAV_ITEMS} />
    </div>
  );
}