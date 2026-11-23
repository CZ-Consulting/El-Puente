"use client";

// app/admin/superadmin/complejos/[id]/page.tsx — Detalle de un complejo:
// selector de complejo (chips, igual estilo que el wireframe), lista de
// usuarios con alta rápida, y la mensualidad del servicio (no confundir con
// las señas de los clientes finales — eso es la tabla "reserva").

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { SectionHeader } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { IconInicio, IconConfiguracion, IconFlechaDerecha } from "@/components/icons";
function periodoLegible(periodoISO: string): string {
  const d = new Date(`${periodoISO}T00:00:00`);
  const texto = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(d);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

interface ComplejoListadoDto {
  id: string;
  nombre: string;
  activo: boolean;
}
interface UsuarioListadoDto {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  complejoId: string | null;
}
interface TerrenoListadoDto {
  id: string;
  complejoId: string;
}
interface PagoServicioListadoDto {
  id: string;
  complejoId: string;
  complejoNombre: string;
  periodo: string;
  pagado: boolean;
  monto: number | null;
}

const ROL_LABEL: Record<string, string> = {
  SuperAdmin: "Super Admin",
  AdminComplejo: "Admin de Complejo",
  Recepcionista: "Recepcionista",
  Preparador: "Preparador",
};

function primerDiaMesActual(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
}

function fechaHoyISO(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
}

export default function ComplejoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [complejos, setComplejos] = useState<ComplejoListadoDto[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioListadoDto[]>([]);
  const [terrenos, setTerrenos] = useState<TerrenoListadoDto[]>([]);
  const [pagos, setPagos] = useState<PagoServicioListadoDto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mostrarFormUsuario, setMostrarFormUsuario] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoPassword, setNuevoPassword] = useState("");
  const [nuevoRol, setNuevoRol] = useState("Recepcionista");
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);
  const [errorUsuario, setErrorUsuario] = useState<string | null>(null);

  const [marcandoPago, setMarcandoPago] = useState(false);
  const [errorPago, setErrorPago] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [c, u, t, p] = await Promise.all([
        api.get<ComplejoListadoDto[]>("/api/complejos"),
        api.get<UsuarioListadoDto[]>("/api/usuarios"),
        api.get<TerrenoListadoDto[]>("/api/terrenos"),
        api.get<PagoServicioListadoDto[]>("/api/pagos-servicio"),
      ]);
      setComplejos(c);
      setUsuarios(u);
      setTerrenos(t);
      setPagos(p);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el complejo.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crearUsuario() {
    if (!nuevoNombre.trim() || !nuevoEmail.trim() || !nuevoPassword.trim()) {
      setErrorUsuario("Nombre, email y contraseña son requeridos.");
      return;
    }
    setGuardandoUsuario(true);
    setErrorUsuario(null);
    try {
      await api.post("/api/usuarios", {
        nombre: nuevoNombre.trim(),
        email: nuevoEmail.trim(),
        password: nuevoPassword,
        rol: nuevoRol,
        complejoId: id,
      });
      setNuevoNombre("");
      setNuevoEmail("");
      setNuevoPassword("");
      setNuevoRol("Recepcionista");
      setMostrarFormUsuario(false);
      await cargar();
    } catch (err) {
      setErrorUsuario(err instanceof ApiError ? err.message : "No se pudo crear el usuario.");
    } finally {
      setGuardandoUsuario(false);
    }
  }

  async function alternarActivo(u: UsuarioListadoDto) {
    try {
      await api.put(`/api/usuarios/${u.id}`, { nombre: u.nombre, activo: !u.activo });
      await cargar();
    } catch {
      // si falla, el usuario simplemente no cambia de estado en pantalla
    }
  }

  async function marcarPagado(pagoExistente: PagoServicioListadoDto | undefined) {
    setMarcandoPago(true);
    setErrorPago(null);
    try {
      let pagoId = pagoExistente?.id;
      if (!pagoId) {
        const creado = await api.post<PagoServicioListadoDto>("/api/pagos-servicio", {
          complejoId: id,
          periodo: primerDiaMesActual(),
        });
        pagoId = creado.id;
      }
      await api.patch(`/api/pagos-servicio/${pagoId}/pagar`, { fechaPago: fechaHoyISO() });
      await cargar();
    } catch (err) {
      setErrorPago(err instanceof ApiError ? err.message : "No se pudo registrar el pago.");
    } finally {
      setMarcandoPago(false);
    }
  }

  if (cargando) return <p className="cargando">Cargando...</p>;
  if (error) return <p className="cargando" style={{ color: "var(--error)" }}>{error}</p>;

  const complejoActual = complejos.find((c) => c.id === id);
  const periodoActual = primerDiaMesActual();
  const usuariosDelComplejo = usuarios.filter((u) => u.complejoId === id);
  const terrenosCount = terrenos.filter((t) => t.complejoId === id).length;
  const pagoActual = pagos.find((p) => p.complejoId === id && p.periodo.startsWith(periodoActual.slice(0, 7)));
  const alDia = !!pagoActual?.pagado;

  return (
    <div className="app-shell">
      <SectionHeader
        titulo="Complejos"
        ayuda="Gestioná los usuarios de este complejo (alta, baja o cambio de rol) y registrá si pagó la mensualidad del servicio."
      />

      <div className="scroll-x" style={{ display: "flex", gap: 8, margin: "0 20px 8px 20px", paddingBottom: 4 }}>
        {complejos.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chip ${c.id === id ? "chip-active" : ""}`}
            onClick={() => router.push(`/admin/superadmin/complejos/${c.id}`)}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      <main className="app-main">
        {complejoActual ? (
          <>
            <div className="card-soft" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16.5 }}>{complejoActual.nombre}</div>
                <div style={{ fontSize: 13.5, opacity: 0.8 }}>
                  {usuariosDelComplejo.length} usuarios · {terrenosCount} terreno{terrenosCount === 1 ? "" : "s"}
                </div>
              </div>
              <span className={`pill ${alDia ? "pill-ok" : "pill-warn"}`}>{alDia ? "AL DÍA" : "ATRASADO"}</span>
            </div>

            <Link href={`/admin/superadmin/complejos/${id}/dashboard`} style={{ textDecoration: "none" }}>
              <div
                className="card"
                style={{ padding: 17, display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span style={{ fontWeight: 600, fontSize: 15.5, color: "var(--ink)" }}>Ver dashboard operativo</span>
                <span className="text-muted">
                  <IconFlechaDerecha />
                </span>
              </div>
            </Link>

            <section style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Usuarios</span>
                <button type="button" className="btn-secondary" onClick={() => setMostrarFormUsuario((v) => !v)}>
                  + Nuevo
                </button>
              </div>

              {mostrarFormUsuario && (
                <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label>Nombre</label>
                  <input className="input" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
                  <label>Email</label>
                  <input className="input" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} type="email" />
                  <label>Contraseña</label>
                  <input className="input" value={nuevoPassword} onChange={(e) => setNuevoPassword(e.target.value)} type="password" />
                  <label>Rol</label>
                  <select className="input" value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value)}>
                    <option value="AdminComplejo">Admin de Complejo</option>
                    <option value="Recepcionista">Recepcionista</option>
                    <option value="Preparador">Preparador</option>
                  </select>
                  {errorUsuario && <p style={{ color: "var(--error)", fontSize: 13.5, margin: 0 }}>{errorUsuario}</p>}
                  <button type="button" className="btn-primary" disabled={guardandoUsuario} onClick={crearUsuario}>
                    {guardandoUsuario ? "Creando..." : "Crear usuario"}
                  </button>
                </div>
              )}

              {usuariosDelComplejo.length === 0 && <p className="text-muted">Todavía no hay usuarios en este complejo.</p>}

              {usuariosDelComplejo.map((u) => (
                <div
                  key={u.id}
                  className="card"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 17px" }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{u.nombre}</div>
                    <div className="text-muted" style={{ fontSize: 13 }}>
                      {ROL_LABEL[u.rol] ?? u.rol}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alternarActivo(u)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      color: u.activo ? "var(--ok)" : "var(--ink-muted)",
                    }}
                  >
                    {u.activo ? "Activo" : "Inactivo"}
                  </button>
                </div>
              ))}
            </section>

            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Pago del servicio</div>
              <div className="text-muted" style={{ fontSize: 13.5 }}>
                Período: {periodoLegible(periodoActual)}
              </div>
              {pagoActual?.pagado ? (
                <div style={{ fontSize: 15, fontWeight: 600 }}>Pagado.</div>
              ) : (
                <>
                  {errorPago && <p style={{ color: "var(--error)", fontSize: 13.5, margin: 0 }}>{errorPago}</p>}
                  <button
                    type="button"
                    disabled={marcandoPago}
                    onClick={() => marcarPagado(pagoActual)}
                    style={{
                      background: "var(--ok)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "999px",
                      padding: 13,
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: "pointer",
                    }}
                  >
                    {marcandoPago ? "Guardando..." : "Marcar pagado"}
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <p className="text-muted">No se encontró ese complejo.</p>
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