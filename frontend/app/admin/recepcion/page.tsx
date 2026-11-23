"use client";

// app/admin/recepcion/page.tsx — réplica de Home.dc.html
//
// Igual al visualizador del Preparador, pero el Recepcionista además puede
// cancelar una reserva "OCUPADA" con el botón rojo dentro de su tarjeta, y
// tiene el botón flotante "Nueva reserva". Es deliberadamente similar al de
// Preparador (misma lógica de ventana/polling) pero no se unificó en un
// componente porque las interacciones divergen (acá sí hay cancelación).

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { fechaHoyLocal, fechaLarga, horaActualRedondeada, horaCorta, sumarHoras } from "@/lib/tiempo";
import { iniciales } from "@/lib/texto";
import { useAuth } from "@/contexts/AuthContext";
import { IdentityHeader } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { IconFlechaIzquierda, IconFlechaDerecha, IconInicio, IconReservas, IconMas } from "@/components/icons";

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

const NAV_ITEMS = [
  { href: "/admin/recepcion", label: "Inicio", icon: <IconInicio /> },
  { href: "/admin/recepcion/nueva", label: "Reservas", icon: <IconReservas /> },
];

export default function HomeRecepcionPage() {
  const { usuario } = useAuth();

  const [terrenos, setTerrenos] = useState<TerrenoListado[]>([]);
  const [terrenoId, setTerrenoId] = useState<string>("");
  const [fecha, setFecha] = useState(fechaHoyLocal());
  const [horaInicio, setHoraInicio] = useState(horaActualRedondeada());

  const [ocupadas, setOcupadas] = useState<ReservaListado[]>([]);
  const [disponibles, setDisponibles] = useState<DisponibilidadTipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);

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

  async function cancelarReserva(r: ReservaListado) {
    const confirmado = window.confirm(
      `¿Cancelar la reserva de ${r.clienteNombre || "este cliente"} (${r.tipoCanchaNombre}, ${horaCorta(r.horaInicio)}–${horaCorta(r.horaFin)})?`,
    );
    if (!confirmado) return;

    setCancelando(r.id);
    try {
      await api.patch(`/api/reservas/${r.id}/cancelar`);
      await cargarVentana();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cancelar la reserva.");
    } finally {
      setCancelando(null);
    }
  }

  if (!usuario) return null;

  return (
    <div className="app-shell">
      <IdentityHeader
        nombre={usuario.nombre}
        subtitulo="Recepcionista"
        iniciales={iniciales(usuario.nombre)}
        ayuda='Acá ves qué canchas están ocupadas o libres en el horario elegido. Tocá "Nueva reserva" para cargar un turno nuevo, o las flechas para mirar otros horarios. Para cancelar una reserva ocupada, tocá el botón rojo "Cancelar reserva" dentro de su tarjeta.'
      />

      <main className="app-main">
        <h1 style={{ fontSize: 26, margin: "4px 0 0 0" }}>Visualizador de canchas</h1>

        {terrenos.length > 1 && (
          <select className="input" value={terrenoId} onChange={(e) => setTerrenoId(e.target.value)}>
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
          <p role="alert" style={{ color: "var(--error)", fontSize: 14 }}>
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
                  <div style={{ textAlign: "right" }}>
                    <span className="pill pill-on-accent">
                      {cancelando === r.id ? "CANCELANDO…" : "OCUPADA"}
                    </span>
                    <button
                      type="button"
                      onClick={() => cancelarReserva(r)}
                      disabled={cancelando === r.id}
                      className="btn-cancelar-reserva"
                    >
                      Cancelar reserva
                    </button>
                  </div>
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

      <Link href="/admin/recepcion/nueva" className="fab">
        <IconMas />
        Nueva reserva
      </Link>

      <BottomNav items={NAV_ITEMS} />
    </div>
  );
}