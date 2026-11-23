"use client";

// app/admin/recepcion/nueva/page.tsx — réplica de NuevaReserva.dc.html
//
// Formulario de alta de reserva. La disponibilidad por tipo de cancha se
// recalcula en vivo contra GET /api/reservas/disponibilidad cada vez que
// cambia fecha/horario, y el precio se recalcula client-side solo como
// preview — el monto real SIEMPRE lo calcula el backend en el POST, nunca
// se manda el total desde acá.

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { fechaHoyLocal, horaActualRedondeada, sumarHoras } from "@/lib/tiempo";
import { formatoMoneda } from "@/lib/texto";
import { SectionHeader } from "@/components/Header";

interface TerrenoListado {
  id: string;
  nombre: string;
}

interface TipoCanchaListado {
  id: string;
  nombre: string;
  jugadoresPorEquipo: number;
  precioPorHora: number;
  activo: boolean;
}

interface DisponibilidadTipo {
  tipoCanchaId: string;
  tipoCanchaNombre: string;
  cantidadDisponible: number;
}

type Metodo = "efectivo" | "transferencia";

export default function NuevaReservaPage() {
  const router = useRouter();

  const [terrenos, setTerrenos] = useState<TerrenoListado[]>([]);
  const [terrenoId, setTerrenoId] = useState("");
  const [tipos, setTipos] = useState<TipoCanchaListado[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadTipo[]>([]);

  const [fecha, setFecha] = useState(fechaHoyLocal());
  const [horaInicio, setHoraInicio] = useState(horaActualRedondeada());
  const [horaFin, setHoraFin] = useState(() => sumarHoras(fechaHoyLocal(), horaActualRedondeada(), 1).hora);
  const [tipoCanchaId, setTipoCanchaId] = useState("");

  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [senaPagada, setSenaPagada] = useState(false);
  const [senaMonto, setSenaMonto] = useState("");
  const [senaMetodo, setSenaMetodo] = useState<Metodo>("efectivo");

  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false);
  // Distingue "la consulta falló" (no bloqueamos nada, el POST final vuelve a
  // validar) de "la consulta funcionó y no hay ningún caso vigente" (ahí sí
  // hay que mostrar todo como no disponible, aunque la lista venga vacía).
  const [errorDisponibilidad, setErrorDisponibilidad] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<TerrenoListado[]>("/api/terrenos").then((data) => {
      setTerrenos(data);
      if (data.length > 0) setTerrenoId((actual) => actual || data[0].id);
    });
    api.get<TipoCanchaListado[]>("/api/tipos-cancha").then((data) => {
      setTipos(data.filter((t) => t.activo));
    });
  }, []);

  const consultarDisponibilidad = useCallback(async () => {
    if (!terrenoId || !horaInicio || !horaFin) return;
    setCargandoDisponibilidad(true);
    try {
      const data = await api.get<DisponibilidadTipo[]>("/api/reservas/disponibilidad", {
        terrenoId,
        fecha,
        horaInicio: `${horaInicio}:00`,
        horaFin: `${horaFin}:00`,
      });
      setDisponibilidad(data);
      setErrorDisponibilidad(false);
    } catch {
      // Si falla la consulta de disponibilidad, no bloqueamos el formulario:
      // el POST final vuelve a validar igual contra el estado real.
      setErrorDisponibilidad(true);
    } finally {
      setCargandoDisponibilidad(false);
    }
  }, [terrenoId, fecha, horaInicio, horaFin]);

  useEffect(() => {
    consultarDisponibilidad();
  }, [consultarDisponibilidad]);

  const disponiblePorTipo = useMemo(() => {
    const mapa = new Map<string, number>();
    disponibilidad.forEach((d) => mapa.set(d.tipoCanchaId, d.cantidadDisponible));
    return mapa;
  }, [disponibilidad]);

  const horas = useMemo(() => {
    const [hi, mi] = horaInicio.split(":").map(Number);
    const [hf, mf] = horaFin.split(":").map(Number);
    const diff = hf * 60 + mf - (hi * 60 + mi);
    return diff > 0 ? diff / 60 : 0;
  }, [horaInicio, horaFin]);

  // "Desde" siempre empuja "Hasta" a una hora después, y "Hasta" nunca se
  // deja fijar en una hora igual o anterior a "Desde" (se lo clampea a
  // Desde+1h en vez de aceptar el valor inválido).
  function cambiarHoraInicio(valor: string) {
    setHoraInicio(valor);
    setHoraFin(sumarHoras(fecha, valor, 1).hora);
  }

  function cambiarHoraFin(valor: string) {
    if (valor <= horaInicio) {
      setHoraFin(sumarHoras(fecha, horaInicio, 1).hora);
      return;
    }
    setHoraFin(valor);
  }

  const tipoSeleccionado = tipos.find((t) => t.id === tipoCanchaId);
  const precioEstimado = tipoSeleccionado ? tipoSeleccionado.precioPorHora * horas : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!terrenoId || !tipoCanchaId) {
      setError("Elegí un tipo de cancha.");
      return;
    }
    if (horas <= 0) {
      setError("La hora de fin debe ser posterior a la de inicio.");
      return;
    }

    setEnviando(true);
    try {
      await api.post("/api/reservas", {
        terrenoId,
        tipoCanchaId,
        fecha,
        horaInicio: `${horaInicio}:00`,
        horaFin: `${horaFin}:00`,
        clienteNombre: clienteNombre || null,
        clienteTelefono: clienteTelefono || null,
        senaPagada,
        senaMonto: senaPagada && senaMonto ? Number(senaMonto) : null,
        senaMetodo: senaPagada ? senaMetodo : null,
      });
      router.push("/admin/recepcion");
    } catch (err) {
      // Acá puede llegar, entre otros, el mensaje de "se generó un conflicto
      // con otra reserva simultánea" de la transacción Serializable del
      // backend — mostramos el texto tal cual, es el pensado para el usuario.
      setError(err instanceof ApiError ? err.message : "No se pudo crear la reserva.");
      await consultarDisponibilidad();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="app-shell">
      <SectionHeader
        titulo="Nueva reserva"
        backHref="/admin/recepcion"
        ayuda='Elegí fecha y horario: abajo vas a ver al toque qué tipos de cancha están disponibles, antes de cargar ningún dato del cliente. Si el cliente solo está preguntando, con eso ya le podés confirmar. Para cargar la reserva, elegí el tipo de cancha disponible y completá los datos.'
      />

      <form onSubmit={handleSubmit} className="app-main" style={{ paddingBottom: 110 }}>
        {terrenos.length > 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <label>Terreno</label>
            <select className="input" value={terrenoId} onChange={(e) => setTerrenoId(e.target.value)}>
              {terrenos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
            <label htmlFor="fecha">Fecha</label>
            <input
              id="fecha"
              type="date"
              className="input"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
            <label htmlFor="hi">Desde</label>
            <input
              id="hi"
              type="time"
              className="input"
              value={horaInicio}
              onChange={(e) => cambiarHoraInicio(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
            <label htmlFor="hf">Hasta</label>
            <input
              id="hf"
              type="time"
              className="input"
              value={horaFin}
              onChange={(e) => cambiarHoraFin(e.target.value)}
              min={sumarHoras(fecha, horaInicio, 1).hora}
            />
          </div>
        </div>

        {/* Disponibilidad en vivo para el horario elegido, ANTES de elegir tipo
            de cancha y de cargar los datos del cliente. Así el dueño o el
            recepcionista le puede dar una respuesta certera al cliente que
            solo está preguntando si hay lugar, sin tener que completar todo
            el formulario "a ciegas" y terminar generando una reserva falsa. */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span className="text-muted" style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Disponibilidad {horaInicio}–{horaFin} {cargandoDisponibilidad && "(actualizando...)"}
          </span>
          {tipos.length === 0 && <p className="text-muted" style={{ fontSize: 14, margin: 0 }}>Cargando tipos de cancha...</p>}
          {tipos.map((t) => {
            const cantidad = disponiblePorTipo.get(t.id) ?? 0;
            const disponible = errorDisponibilidad || cantidad > 0;
            return (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 15 }}>{t.nombre}</span>
                <span className={`pill ${disponible ? "pill-ok" : "pill-error"}`}>
                  {disponible ? "DISPONIBLE" : "NO DISPONIBLE"}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Tipo de cancha</span>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {tipos.map((t) => {
              const cantidad = disponiblePorTipo.get(t.id) ?? 0;
              const disponible = errorDisponibilidad || cantidad > 0;
              const activo = t.id === tipoCanchaId;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={!disponible}
                  onClick={() => setTipoCanchaId(t.id)}
                  className="chip"
                  style={
                    !disponible
                      ? { background: "var(--disabled)", color: "var(--ink-muted)", cursor: "not-allowed" }
                      : activo
                        ? { background: "var(--accent-fill)", color: "var(--on-accent)", borderColor: "var(--accent-fill)" }
                        : undefined
                  }
                >
                  {t.nombre}
                </button>
              );
            })}
          </div>
        </div>

        {tipoSeleccionado && (
          <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="text-muted" style={{ fontSize: 15 }}>
              Precio estimado
            </span>
            <span className="font-display" style={{ fontSize: 22 }}>
              {formatoMoneda(precioEstimado)}
            </span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Datos del cliente</span>
          <input
            type="text"
            placeholder="Nombre del cliente"
            className="input"
            value={clienteNombre}
            onChange={(e) => setClienteNombre(e.target.value)}
          />
          <input
            type="tel"
            inputMode="numeric"
            placeholder="Teléfono"
            className="input"
            value={clienteTelefono}
            // Se guarda como string igual (puede tener 0 adelante, etc.),
            // pero en el input solo se dejan escribir dígitos.
            onChange={(e) => setClienteTelefono(e.target.value.replace(/\D/g, ""))}
          />
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>¿Pagó seña?</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => setSenaPagada(true)}
                className="chip"
                style={
                  senaPagada
                    ? { background: "var(--accent-fill)", color: "var(--on-accent)", borderColor: "var(--accent-fill)" }
                    : undefined
                }
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => setSenaPagada(false)}
                className="chip"
                style={
                  !senaPagada
                    ? { background: "var(--accent-fill)", color: "var(--on-accent)", borderColor: "var(--accent-fill)" }
                    : undefined
                }
              >
                No
              </button>
            </div>
          </div>

          {senaPagada && (
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <label htmlFor="monto" className="text-muted" style={{ fontSize: 13.5, fontWeight: 400 }}>
                  Monto
                </label>
                <input
                  id="monto"
                  type="number"
                  min="0"
                  className="input"
                  value={senaMonto}
                  onChange={(e) => setSenaMonto(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="text-muted" style={{ fontSize: 13.5 }}>
                  Método
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setSenaMetodo("efectivo")}
                    className="chip"
                    style={
                      senaMetodo === "efectivo"
                        ? { flex: 1, background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent)" }
                        : { flex: 1 }
                    }
                  >
                    Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setSenaMetodo("transferencia")}
                    className="chip"
                    style={
                      senaMetodo === "transferencia"
                        ? { flex: 1, background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent)" }
                        : { flex: 1 }
                    }
                  >
                    Transf.
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" style={{ color: "var(--error)", fontSize: 14 }}>
            {error}
          </p>
        )}

        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: 480,
            background: "var(--bg)",
            padding: "14px 20px calc(22px + env(safe-area-inset-bottom)) 20px",
            borderTop: "1.5px solid var(--border)",
          }}
        >
          <button type="submit" disabled={enviando || !tipoCanchaId} className="btn-primary">
            {enviando ? "Confirmando..." : "Confirmar reserva"}
          </button>
        </div>
      </form>
    </div>
  );
}