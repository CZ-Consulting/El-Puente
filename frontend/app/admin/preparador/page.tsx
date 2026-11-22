"use client";

// app/admin/preparador/page.tsx
//
// Visualizador operativo: qué canchas están ocupadas en el horario que se
// está mirando (ventana fija de 1 hora) y qué tipos/cantidades siguen
// disponibles, con navegación a la hora anterior/siguiente. Pensado para que
// el Preparador organice la cancha antes de cada turno.
//
// Frescura de datos: polling cada 15s + refetch al volver a la pestaña,
// según lo documentado en arquitectura-stack.md para pantallas sensibles al
// horario (más corto que el ~30s general del resto de la app).

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fechaHoyLocal, horaActualRedondeada, horaCorta, sumarHoras } from "@/lib/tiempo";

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

export default function VisualizadorOperativoPage() {
  const [terrenos, setTerrenos] = useState<TerrenoListado[]>([]);
  const [terrenoId, setTerrenoId] = useState<string>("");
  const [fecha, setFecha] = useState(fechaHoyLocal());
  const [horaInicio, setHoraInicio] = useState(horaActualRedondeada());

  const [ocupadas, setOcupadas] = useState<ReservaListado[]>([]);
  const [disponibles, setDisponibles] = useState<DisponibilidadTipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const horaFin = sumarHoras(fecha, horaInicio, DURACION_VENTANA_HORAS).hora;

  // Carga inicial de terrenos del complejo (RLS ya acota al propio complejo).
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

      // Solapamiento clásico, igual al que usa el backend: ocupa la ventana
      // si empezó antes de que termine la ventana y termina después de que
      // empieza la ventana.
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

  return (
    <main className="visualizador-page">
      <h1>Visualizador operativo</h1>

      <div className="visualizador-controles">
        {terrenos.length > 1 && (
          <select value={terrenoId} onChange={(e) => setTerrenoId(e.target.value)}>
            {terrenos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        )}

        <button type="button" onClick={() => moverVentana(-DURACION_VENTANA_HORAS)}>
          ← Anterior
        </button>

        <span className="visualizador-horario">
          {fecha} · {horaInicio} a {horaFin}
        </span>

        <button type="button" onClick={() => moverVentana(DURACION_VENTANA_HORAS)}>
          Siguiente →
        </button>
      </div>

      {error && <p role="alert">{error}</p>}
      {cargando && <p>Cargando...</p>}

      {!cargando && (
        <div className="visualizador-contenido">
          <section>
            <h2>Ocupado en este horario</h2>
            {ocupadas.length === 0 ? (
              <p>No hay canchas ocupadas en este horario.</p>
            ) : (
              <ul>
                {ocupadas.map((r) => (
                  <li key={r.id}>
                    <strong>{r.tipoCanchaNombre}</strong> · {horaCorta(r.horaInicio)} a{" "}
                    {horaCorta(r.horaFin)} · {r.clienteNombre || "Sin nombre"}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2>Disponible</h2>
            {disponibles.length === 0 ? (
              <p>No queda disponibilidad en este horario.</p>
            ) : (
              <ul>
                {disponibles.map((d) => (
                  <li key={d.tipoCanchaId}>
                    {d.tipoCanchaNombre}: {d.cantidadDisponible} disponible
                    {d.cantidadDisponible !== 1 ? "s" : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}