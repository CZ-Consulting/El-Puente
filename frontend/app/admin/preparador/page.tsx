"use client";

// app/admin/preparador/page.tsx — réplica de HomePreparador.dc.html
//
// Visualizador operativo: qué canchas están ocupadas en el horario que se
// está mirando (ventana fija de 1 hora) y qué tipos/cantidades siguen
// disponibles, con navegación a la hora anterior/siguiente.
//
// Frescura de datos: polling cada 15s + refetch al volver a la pestaña,
// según lo documentado en arquitectura-stack.md para pantallas sensibles al
// horario (más corto que el ~30s general del resto de la app).

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fechaHoyLocal, fechaLarga, horaActualRedondeada, horaCorta, sumarHoras } from "@/lib/tiempo";
import { iniciales } from "@/lib/texto";
import { useAuth } from "@/contexts/AuthContext";
import { IdentityHeader } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { IconFlechaIzquierda, IconFlechaDerecha, IconInicio, IconCuenta } from "@/components/icons";

interface TerrenoListado {
  id: string;
  nombre: string;
}

interface ReservaListado {
  id: string;
  terrenoId: string;
  tipoCanchaId: string;
  tipoCanchaNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  clienteNombre: string | null;
  precioTotal: number;
  estado: string;
}

interface DisponibilidadTipo {
  tipoCanchaId: string;
  tipoCanchaNombre: string;
  cantidadDisponible: number;
}

const DURACION_VENTANA_HORAS = 1;
const INTERVALO_POLLING_MS = 15_000;

const NAV_ITEMS = [{ href: "/admin/preparador", label: "Inicio", icon: <IconInicio /> }];

export default function VisualizadorOperativoPage() {
  const { usuario } = useAuth();

  const [terrenos, setTerrenos] = useState<TerrenoListado[]>([]);
  const [terrenoId, setTerrenoId] = useState<string>("");
  const [fecha, setFecha] = useState(fechaHoyLocal());
  const [horaInicio, setHoraInicio] = useState(horaActualRedondeada());

  const [ocupadas, setOcupadas] = useState<ReservaListado[]>([]);
  const [disponibles, setDisponibles] = useState<DisponibilidadTipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const horaFin = sumarHoras(fecha, horaInicio, DURACION_VENTANA_HORAS).hora;

  useEffect(() => {
    api
      .get<TerrenoListado[]>("/api/terrenos")
      .then((data) => {
        setTerrenos(data);
        if (data.length > 0) setTerrenoId((actual) => actual || data[0].id);
      })
      .catch(() => setError("No se pudieron cargar los terrenos."));
  }, []);

  const cargarVentana = useCallback(async () => {
    if (!terrenoId) return;
    setError(null);
    try {
      const [reservasDelDia, disponibilidad] = await Promise.all([
        api.get<ReservaListado[]>("/api/reservas", { terrenoId, fecha }),
        api.get<DisponibilidadTipo[]>("/api/reservas/disponibilidad", {
          terrenoId,
          fecha,
          horaInicio: `${horaInicio}:00`,
          horaFin: `${horaFin}:00`,
        }),
      ]);

      const enVentana = reservasDelDia.filter(
        (r) =>
          r.estado === "confirmada" &&
          horaCorta(r.horaInicio) < horaFin &&
          horaInicio < horaCorta(r.horaFin),
      );

      setOcupadas(enVentana);
      setDisponibles(disponibilidad);
    } catch {
      setError("No se pudo actualizar la disponibilidad. Reintentando...");
    } finally {
      setCargando(false);
    }
  }, [terrenoId, fecha, horaInicio, horaFin]);

  useEffect(() => {
    setCargando(true);
    cargarVentana();

    const intervalo = setInterval(cargarVentana, INTERVALO_POLLING_MS);
    const alVolver = () => {
      if (document.visibilityState === "visible") cargarVentana();
    };
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [cargarVentana]);

  function moverVentana(deltaHoras: number) {
    const resultado = sumarHoras(fecha, horaInicio, deltaHoras);
    setFecha(resultado.fecha);
    setHoraInicio(resultado.hora);
  }

  if (!usuario) return null;

  return (
    <div className="app-shell">
      <IdentityHeader
        nombre={usuario.nombre}
        subtitulo="Preparador"
        iniciales={iniciales(usuario.nombre)}
        ayuda="Acá ves qué canchas están ocupadas o libres en cada horario, para organizar la cancha antes de que lleguen los equipos. Usá las flechas para mirar otros horarios."
      />

      <main className="app-main">
        <h1 style={{ fontSize: 26, margin: "4px 0 0 0" }}>Visualizador de canchas</h1>

        {terrenos.length > 1 && (
          <select
            className="input"
            value={terrenoId}
            onChange={(e) => setTerrenoId(e.target.value)}
          >
            {terrenos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        )}

        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 16px" }}>
          <button
            aria-label="Horario anterior"
            onClick={() => moverVentana(-DURACION_VENTANA_HORAS)}
            style={{
              background: "var(--bg)",
              border: "none",
              borderRadius: 12,
              width: 44,
              height: 44,
              cursor: "pointer",
              color: "var(--ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconFlechaIzquierda />
          </button>
          <div style={{ textAlign: "center" }}>
            <div className="text-muted" style={{ fontSize: 14 }}>
              {fechaLarga(fecha)}
            </div>
            <div className="font-display" style={{ fontSize: 27 }}>
              {horaInicio} – {horaFin}
            </div>
          </div>
          <button
            aria-label="Horario siguiente"
            onClick={() => moverVentana(DURACION_VENTANA_HORAS)}
            style={{
              background: "var(--bg)",
              border: "none",
              borderRadius: 12,
              width: 44,
              height: 44,
              cursor: "pointer",
              color: "var(--ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconFlechaDerecha />
          </button>
        </div>

        {error && (
          <p role="alert" style={{ color: "var(--warn)", fontSize: 14 }}>
            {error}
          </p>
        )}

        {cargando ? (
          <p className="cargando">Cargando...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {ocupadas.length === 0 && disponibles.length === 0 && (
              <p className="text-muted">No hay datos de disponibilidad para este horario.</p>
            )}

            {ocupadas.map((r) => (
              <div key={r.id} className="card-accent">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 13, opacity: 0.85, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {r.tipoCanchaNombre}
                    </div>
                    <div className="font-display" style={{ fontSize: 20, marginTop: 3 }}>
                      {r.clienteNombre || "Sin nombre"}
                    </div>
                  </div>
                  <span className="pill pill-on-accent">OCUPADA</span>
                </div>
                <div style={{ fontSize: 14, opacity: 0.9, marginTop: 8 }}>
                  {horaCorta(r.horaInicio)} a {horaCorta(r.horaFin)}
                </div>
              </div>
            ))}

            {disponibles.map((d) => (
              <div key={d.tipoCanchaId} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div className="text-muted" style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {d.tipoCanchaNombre}
                    </div>
                    <div className="font-display" style={{ fontSize: 20, marginTop: 3 }}>
                      Disponible · {d.cantidadDisponible}
                    </div>
                  </div>
                  <span className="pill pill-ok">LIBRE</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav items={NAV_ITEMS} />
    </div>
  );
}