"use client";

// app/admin/superadmin/configuracion/page.tsx — Tipos de cancha y "casos de
// partición" (qué combinaciones de canchas se pueden reservar al mismo
// tiempo) de un terreno. Como SuperAdmin administra varios complejos, se
// agrega un selector de complejo (mismo estilo chip que la pantalla de
// Complejos) que no está en el wireframe original pero es necesario para
// poder configurar más de un cliente — si el complejo tiene un solo
// terreno (el caso típico) se lo toma directo y se muestra "Terreno único"
// tal cual el wireframe; si tiene más de uno, aparece un segundo selector.
//
// GET /api/configuraciones?terrenoId=... no trae los items de cada caso
// (ver ConfiguracionListadoDto), así que se pide el detalle de cada caso
// por separado para poder mostrar/editar sus cantidades.

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { SectionHeader } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { IconInicio, IconConfiguracion, IconMas } from "@/components/icons";

interface ComplejoListadoDto {
  id: string;
  nombre: string;
  activo: boolean;
}
interface TerrenoListadoDto {
  id: string;
  nombre: string;
  complejoId: string;
}
interface TipoCanchaListadoDto {
  id: string;
  nombre: string;
  jugadoresPorEquipo: number;
  precioPorHora: number;
  activo: boolean;
  complejoId: string;
}
interface ConfiguracionListadoDto {
  id: string;
  nombre: string;
  terrenoId: string;
}
interface ConfiguracionItemDto {
  tipoCanchaId: string;
  tipoCanchaNombre: string;
  cantidad: number;
}
interface ConfiguracionDetalleDto {
  id: string;
  nombre: string;
  terrenoId: string;
  complejoId: string;
  items: ConfiguracionItemDto[];
}

export default function SuperAdminConfiguracionPage() {
  const [complejos, setComplejos] = useState<ComplejoListadoDto[]>([]);
  const [terrenos, setTerrenos] = useState<TerrenoListadoDto[]>([]);
  const [tipos, setTipos] = useState<TipoCanchaListadoDto[]>([]);
  const [casos, setCasos] = useState<ConfiguracionDetalleDto[]>([]);
  const [complejoId, setComplejoId] = useState<string | null>(null);
  const [terrenoId, setTerrenoId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoCasos, setCargandoCasos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ediciones locales de cantidades por caso: solo se mandan al backend al
  // tocar "Guardar" (igual que en el formulario de Nueva reserva).
  const [ediciones, setEdiciones] = useState<Record<string, ConfiguracionItemDto[]>>({});
  const [guardandoCaso, setGuardandoCaso] = useState<string | null>(null);
  const [errorCaso, setErrorCaso] = useState<Record<string, string>>({});

  const [mostrarFormTipo, setMostrarFormTipo] = useState(false);
  const [tipoNombre, setTipoNombre] = useState("");
  const [tipoJugadores, setTipoJugadores] = useState("6");
  const [tipoPrecio, setTipoPrecio] = useState("0");
  const [guardandoTipo, setGuardandoTipo] = useState(false);
  const [errorTipo, setErrorTipo] = useState<string | null>(null);

  const [mostrarFormCaso, setMostrarFormCaso] = useState(false);
  const [casoNombre, setCasoNombre] = useState("");
  const [casoItems, setCasoItems] = useState<{ tipoCanchaId: string; cantidad: string }[]>([{ tipoCanchaId: "", cantidad: "1" }]);
  const [guardandoCasoNuevo, setGuardandoCasoNuevo] = useState(false);
  const [errorCasoNuevo, setErrorCasoNuevo] = useState<string | null>(null);

  const [mostrarFormTerreno, setMostrarFormTerreno] = useState(false);
  const [terrenoNombreNuevo, setTerrenoNombreNuevo] = useState("");
  const [guardandoTerreno, setGuardandoTerreno] = useState(false);
  const [errorTerreno, setErrorTerreno] = useState<string | null>(null);

  const cargarBase = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [c, t, tc] = await Promise.all([
        api.get<ComplejoListadoDto[]>("/api/complejos"),
        api.get<TerrenoListadoDto[]>("/api/terrenos"),
        api.get<TipoCanchaListadoDto[]>("/api/tipos-cancha"),
      ]);
      setComplejos(c);
      setTerrenos(t);
      setTipos(tc);
      if (!complejoId && c.length > 0) setComplejoId(c[0].id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar la configuración.");
    } finally {
      setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarBase();
  }, [cargarBase]);

  const terrenosDelComplejo = terrenos.filter((t) => t.complejoId === complejoId);

  // Si el complejo cambia y tiene un único terreno, se auto-selecciona.
  useEffect(() => {
    if (terrenosDelComplejo.length === 1) {
      setTerrenoId(terrenosDelComplejo[0].id);
    } else if (terrenosDelComplejo.length === 0) {
      setTerrenoId(null);
    } else if (!terrenosDelComplejo.some((t) => t.id === terrenoId)) {
      setTerrenoId(terrenosDelComplejo[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complejoId, terrenos]);

  const cargarCasos = useCallback(async (tId: string) => {
    setCargandoCasos(true);
    try {
      const lista = await api.get<ConfiguracionListadoDto[]>("/api/configuraciones", { terrenoId: tId });
      const detalles = await Promise.all(
        lista.map((c) => api.get<ConfiguracionDetalleDto>(`/api/configuraciones/${c.id}`)),
      );
      setCasos(detalles);
      setEdiciones(Object.fromEntries(detalles.map((d) => [d.id, d.items.map((i) => ({ ...i }))])));
    } catch {
      setCasos([]);
    } finally {
      setCargandoCasos(false);
    }
  }, []);

  useEffect(() => {
    if (terrenoId) cargarCasos(terrenoId);
    else setCasos([]);
  }, [terrenoId, cargarCasos]);

  const tiposDelComplejo = tipos.filter((t) => t.complejoId === complejoId);

  function nombreTipo(tipoCanchaId: string): string {
    return tiposDelComplejo.find((t) => t.id === tipoCanchaId)?.nombre ?? "Tipo eliminado";
  }

  function cambiarCantidad(casoId: string, tipoCanchaId: string, delta: number) {
    setEdiciones((prev) => {
      const items = prev[casoId] ?? [];
      const nuevos = items
        .map((i) => (i.tipoCanchaId === tipoCanchaId ? { ...i, cantidad: Math.max(0, i.cantidad + delta) } : i))
        .filter((i) => i.cantidad > 0);
      return { ...prev, [casoId]: nuevos };
    });
  }

  function agregarTipoACaso(casoId: string, tipoCanchaId: string) {
    if (!tipoCanchaId) return;
    setEdiciones((prev) => {
      const items = prev[casoId] ?? [];
      if (items.some((i) => i.tipoCanchaId === tipoCanchaId)) return prev;
      return {
        ...prev,
        [casoId]: [...items, { tipoCanchaId, tipoCanchaNombre: nombreTipo(tipoCanchaId), cantidad: 1 }],
      };
    });
  }

  async function guardarCaso(caso: ConfiguracionDetalleDto) {
    const items = ediciones[caso.id] ?? [];
    if (items.length === 0) {
      setErrorCaso((prev) => ({ ...prev, [caso.id]: "Un caso necesita al menos un ítem." }));
      return;
    }
    setGuardandoCaso(caso.id);
    setErrorCaso((prev) => ({ ...prev, [caso.id]: "" }));
    try {
      await api.put(`/api/configuraciones/${caso.id}`, {
        nombre: caso.nombre,
        items: items.map((i) => ({ tipoCanchaId: i.tipoCanchaId, cantidad: i.cantidad })),
      });
      if (terrenoId) await cargarCasos(terrenoId);
    } catch (err) {
      setErrorCaso((prev) => ({
        ...prev,
        [caso.id]: err instanceof ApiError ? err.message : "No se pudo guardar el caso.",
      }));
    } finally {
      setGuardandoCaso(null);
    }
  }

  async function eliminarCaso(casoId: string) {
    if (!window.confirm("¿Borrar este caso de partición?")) return;
    try {
      await api.delete(`/api/configuraciones/${casoId}`);
      if (terrenoId) await cargarCasos(terrenoId);
    } catch (err) {
      setErrorCaso((prev) => ({
        ...prev,
        [casoId]: err instanceof ApiError ? err.message : "No se pudo borrar el caso.",
      }));
    }
  }

  async function crearTipoCancha() {
    if (!tipoNombre.trim() || !complejoId) {
      setErrorTipo("El nombre es requerido.");
      return;
    }
    setGuardandoTipo(true);
    setErrorTipo(null);
    try {
      await api.post("/api/tipos-cancha", {
        nombre: tipoNombre.trim(),
        jugadoresPorEquipo: Number(tipoJugadores) || 0,
        precioPorHora: Number(tipoPrecio) || 0,
        complejoId,
      });
      setTipoNombre("");
      setTipoJugadores("6");
      setTipoPrecio("0");
      setMostrarFormTipo(false);
      await cargarBase();
    } catch (err) {
      setErrorTipo(err instanceof ApiError ? err.message : "No se pudo crear el tipo de cancha.");
    } finally {
      setGuardandoTipo(false);
    }
  }

  async function crearTerreno() {
    if (!terrenoNombreNuevo.trim() || !complejoId) {
      setErrorTerreno("El nombre es requerido.");
      return;
    }
    setGuardandoTerreno(true);
    setErrorTerreno(null);
    try {
      const creado = await api.post<TerrenoListadoDto>("/api/terrenos", {
        nombre: terrenoNombreNuevo.trim(),
        complejoId,
      });
      setTerrenoNombreNuevo("");
      setMostrarFormTerreno(false);
      await cargarBase();
      setTerrenoId(creado.id);
    } catch (err) {
      setErrorTerreno(err instanceof ApiError ? err.message : "No se pudo crear el terreno.");
    } finally {
      setGuardandoTerreno(false);
    }
  }

  function actualizarItemNuevoCaso(idx: number, campo: "tipoCanchaId" | "cantidad", valor: string) {
    setCasoItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [campo]: valor } : it)));
  }

  async function crearCaso() {
    const items = casoItems
      .filter((i) => i.tipoCanchaId && Number(i.cantidad) > 0)
      .map((i) => ({ tipoCanchaId: i.tipoCanchaId, cantidad: Number(i.cantidad) }));
    if (!terrenoId || items.length === 0) {
      setErrorCasoNuevo("Elegí al menos un tipo de cancha y una cantidad.");
      return;
    }
    setGuardandoCasoNuevo(true);
    setErrorCasoNuevo(null);
    try {
      await api.post("/api/configuraciones", {
        nombre: casoNombre.trim() || `Caso ${casos.length + 1}`,
        terrenoId,
        items,
      });
      setCasoNombre("");
      setCasoItems([{ tipoCanchaId: "", cantidad: "1" }]);
      setMostrarFormCaso(false);
      await cargarCasos(terrenoId);
    } catch (err) {
      setErrorCasoNuevo(err instanceof ApiError ? err.message : "No se pudo crear el caso.");
    } finally {
      setGuardandoCasoNuevo(false);
    }
  }

  if (cargando) return <p className="cargando">Cargando...</p>;

  const complejoActual = complejos.find((c) => c.id === complejoId);
  const terrenoActual = terrenosDelComplejo.find((t) => t.id === terrenoId);

  return (
    <div className="app-shell">
      <SectionHeader
        titulo={terrenosDelComplejo.length > 1 ? terrenoActual?.nombre ?? "Terreno" : "Terreno único"}
        ayuda='Definí los tipos de cancha de este terreno y armá los "casos": las combinaciones de cantidades que se pueden reservar al mismo tiempo. El sistema descarta el resto automáticamente.'
      />
      <div className="text-muted" style={{ fontSize: 14, margin: "-8px 20px 0 20px" }}>
        {complejoActual?.nombre ?? ""}
      </div>

      <div className="scroll-x" style={{ display: "flex", gap: 8, margin: "10px 20px 0 20px", paddingBottom: 4 }}>
        {complejos.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chip ${c.id === complejoId ? "chip-active" : ""}`}
            onClick={() => setComplejoId(c.id)}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      {terrenosDelComplejo.length > 1 && (
        <div className="scroll-x" style={{ display: "flex", gap: 8, margin: "8px 20px 0 20px", paddingBottom: 4 }}>
          {terrenosDelComplejo.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip ${t.id === terrenoId ? "chip-active" : ""}`}
              onClick={() => setTerrenoId(t.id)}
            >
              {t.nombre}
            </button>
          ))}
        </div>
      )}

      {terrenosDelComplejo.length >= 1 && complejoId && (
        <div style={{ margin: "8px 20px 0 20px" }}>
          <button
            type="button"
            onClick={() => setMostrarFormTerreno((v) => !v)}
            style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", padding: 0 }}
          >
            + Otro terreno en este complejo
          </button>
          {mostrarFormTerreno && (
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              <label>Nombre del terreno</label>
              <input
                className="input"
                value={terrenoNombreNuevo}
                onChange={(e) => setTerrenoNombreNuevo(e.target.value)}
                placeholder="Ej: Terreno 2"
              />
              {errorTerreno && <p style={{ color: "var(--warn)", fontSize: 13.5, margin: 0 }}>{errorTerreno}</p>}
              <button type="button" className="btn-primary" disabled={guardandoTerreno} onClick={crearTerreno}>
                {guardandoTerreno ? "Creando..." : "Crear terreno"}
              </button>
            </div>
          )}
        </div>
      )}

      <main className="app-main">
        {error && <p style={{ color: "var(--warn)" }}>{error}</p>}

        <p className="text-muted" style={{ fontSize: 14.5, margin: 0 }}>
          Esta configuración define qué combinaciones de canchas se pueden reservar al mismo tiempo. Solo el Super
          Admin puede modificarla.
        </p>

        {!terrenoId && !error && (
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p className="text-muted" style={{ margin: 0 }}>Este complejo todavía no tiene un terreno creado.</p>
            <label>Nombre del terreno</label>
            <input
              className="input"
              value={terrenoNombreNuevo}
              onChange={(e) => setTerrenoNombreNuevo(e.target.value)}
              placeholder="Ej: Terreno principal"
            />
            {errorTerreno && <p style={{ color: "var(--warn)", fontSize: 13.5, margin: 0 }}>{errorTerreno}</p>}
            <button type="button" className="btn-primary" disabled={guardandoTerreno} onClick={crearTerreno}>
              {guardandoTerreno ? "Creando..." : "Crear terreno"}
            </button>
          </div>
        )}

        {terrenoId && (
          <>
            <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Tipos de cancha</span>
                <button type="button" className="btn-secondary" onClick={() => setMostrarFormTipo((v) => !v)}>
                  + Agregar
                </button>
              </div>

              {mostrarFormTipo && (
                <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label>Nombre</label>
                  <input className="input" value={tipoNombre} onChange={(e) => setTipoNombre(e.target.value)} placeholder="Ej: Cancha de 6" />
                  <label>Jugadores por equipo</label>
                  <input className="input" type="number" min="1" value={tipoJugadores} onChange={(e) => setTipoJugadores(e.target.value)} />
                  <label>Precio por hora</label>
                  <input className="input" type="number" min="0" value={tipoPrecio} onChange={(e) => setTipoPrecio(e.target.value)} />
                  {errorTipo && <p style={{ color: "var(--warn)", fontSize: 13.5, margin: 0 }}>{errorTipo}</p>}
                  <button type="button" className="btn-primary" disabled={guardandoTipo} onClick={crearTipoCancha}>
                    {guardandoTipo ? "Creando..." : "Crear tipo de cancha"}
                  </button>
                </div>
              )}

              {tiposDelComplejo.length === 0 && <p className="text-muted">Todavía no hay tipos de cancha.</p>}

              {tiposDelComplejo.map((t) => (
                <div key={t.id} className="card">
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{t.nombre}</div>
                  <div className="text-muted" style={{ fontSize: 13.5, marginTop: 2 }}>
                    {t.jugadoresPorEquipo * 2} jugadores por partido
                  </div>
                </div>
              ))}
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Casos de partición</span>
                <button
                  type="button"
                  onClick={() => setMostrarFormCaso((v) => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "var(--accent-fill)",
                    color: "var(--on-accent)",
                    border: "none",
                    borderRadius: "999px",
                    padding: "9px 15px",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  <IconMas /> Agregar
                </button>
              </div>

              {mostrarFormCaso && (
                <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label>Nombre (opcional)</label>
                  <input className="input" value={casoNombre} onChange={(e) => setCasoNombre(e.target.value)} placeholder={`Caso ${casos.length + 1}`} />
                  {casoItems.map((it, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 8 }}>
                      <select
                        className="input"
                        value={it.tipoCanchaId}
                        onChange={(e) => actualizarItemNuevoCaso(idx, "tipoCanchaId", e.target.value)}
                      >
                        <option value="">Tipo de cancha...</option>
                        {tiposDelComplejo.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nombre}
                          </option>
                        ))}
                      </select>
                      <input
                        className="input"
                        style={{ width: 70, flex: "0 0 auto" }}
                        type="number"
                        min="1"
                        value={it.cantidad}
                        onChange={(e) => actualizarItemNuevoCaso(idx, "cantidad", e.target.value)}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setCasoItems((prev) => [...prev, { tipoCanchaId: "", cantidad: "1" }])}
                  >
                    + Otro tipo de cancha
                  </button>
                  {errorCasoNuevo && <p style={{ color: "var(--warn)", fontSize: 13.5, margin: 0 }}>{errorCasoNuevo}</p>}
                  <button type="button" className="btn-primary" disabled={guardandoCasoNuevo} onClick={crearCaso}>
                    {guardandoCasoNuevo ? "Creando..." : "Crear caso"}
                  </button>
                </div>
              )}

              {cargandoCasos && <p className="text-muted">Cargando casos...</p>}

              {!cargandoCasos && casos.length === 0 && <p className="text-muted">Todavía no hay casos de partición.</p>}

              {casos.map((caso) => {
                const items = ediciones[caso.id] ?? [];
                const disponiblesParaAgregar = tiposDelComplejo.filter(
                  (t) => !items.some((i) => i.tipoCanchaId === t.id),
                );
                return (
                  <div key={caso.id} className="card">
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 11 }}>{caso.nombre}</div>

                    {items.map((item) => (
                      <div
                        key={item.tipoCanchaId}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "9px 0",
                          borderTop: "1px solid var(--border)",
                        }}
                      >
                        <span style={{ fontSize: 14.5 }}>{nombreTipo(item.tipoCanchaId)}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <button
                            type="button"
                            className="btn-icon"
                            style={{ width: 30, height: 30, borderRadius: 9 }}
                            onClick={() => cambiarCantidad(caso.id, item.tipoCanchaId, -1)}
                          >
                            –
                          </button>
                          <span style={{ fontWeight: 700, width: 18, textAlign: "center", fontSize: 15 }}>{item.cantidad}</span>
                          <button
                            type="button"
                            className="btn-icon"
                            style={{ width: 30, height: 30, borderRadius: 9 }}
                            onClick={() => cambiarCantidad(caso.id, item.tipoCanchaId, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}

                    {disponiblesParaAgregar.length > 0 && (
                      <select
                        className="input"
                        style={{ marginTop: 10 }}
                        value=""
                        onChange={(e) => agregarTipoACaso(caso.id, e.target.value)}
                      >
                        <option value="">+ Agregar tipo de cancha a este caso...</option>
                        {disponiblesParaAgregar.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nombre}
                          </option>
                        ))}
                      </select>
                    )}

                    {errorCaso[caso.id] && (
                      <p style={{ color: "var(--warn)", fontSize: 13.5, margin: "10px 0 0 0" }}>{errorCaso[caso.id]}</p>
                    )}

                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ flex: 1 }}
                        disabled={guardandoCaso === caso.id}
                        onClick={() => guardarCaso(caso)}
                      >
                        {guardandoCaso === caso.id ? "Guardando..." : "Guardar"}
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => eliminarCaso(caso.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="card-soft" style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                El sistema descarta automáticamente los casos que ya no entran según lo reservado en cada horario — no
                hace falta configurar la posición física de cada cancha.
              </p>
            </section>
          </>
        )}
      </main>

      <BottomNav
        items={[
          { href: "/admin/superadmin", label: "Complejos", icon: <IconInicio /> },
          { href: "/admin/superadmin/configuracion", label: "Configuración", icon: <IconConfiguracion /> },
        ]}
      />
    </div>
  );
}