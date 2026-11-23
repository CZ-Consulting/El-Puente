"use client";

// components/RecaudacionDashboard.tsx — cuerpo del dashboard operativo
// (recaudación por período, por día y por tipo de cancha), compartido por:
//   - app/admin/complejo/dashboard/page.tsx (AdminComplejo ve el suyo,
//     RLS lo acota solo a su complejo sin que haga falta pasar complejoId)
//   - app/admin/superadmin/complejos/[id]/dashboard/page.tsx (SuperAdmin
//     elige un complejo puntual y se lo pasamos acá vía complejoId)
//
// El header, el bottom-nav y el "app-shell" quedan afuera: cada pantalla
// que lo usa tiene su propia navegación.

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { fechaHoyLocal } from "@/lib/tiempo";
import { formatoMoneda } from "@/lib/texto";

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

export function RecaudacionDashboard({ complejoId }: { complejoId?: string }) {
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
      .get<RecaudacionDto>("/api/reportes/recaudacion", { desde, hasta, complejoId })
      .then(setDatos)
      .finally(() => setCargando(false));
  }, [desde, hasta, complejoId]);

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
    <>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {datos.porDia.map((d) => (
              <div key={d.fecha}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>
                    {etiquetaDia(d.fecha, datos.porDia.length <= 7)}
                  </span>
                  <span className="font-display" style={{ fontSize: 17 }}>
                    {formatoMoneda(d.total)}
                  </span>
                </div>
                <div className="text-muted" style={{ fontSize: 12.5, marginTop: 1 }}>
                  {d.cantidadReservas} {d.cantidadReservas === 1 ? "reserva" : "reservas"}
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
                      width: `${(d.total / maximoDia) * 100}%`,
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
                <div className="text-muted" style={{ fontSize: 12.5, marginTop: 1 }}>
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
    </>
  );
}