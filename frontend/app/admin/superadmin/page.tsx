"use client";

// app/admin/superadmin/page.tsx — Home de SuperAdmin: lista de complejos
// clientes, con estado de pago del servicio (AL DÍA / ATRASADO) y conteo de
// usuarios/terrenos de cada uno. Tres llamadas además de /api/complejos
// porque los listados de usuarios/terrenos/pagos-servicio son planos (sin
// agrupar por complejo del lado del server) — se agrupan aquí.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { saludoPorHora } from "@/lib/tiempo";
import { useAuth } from "@/contexts/AuthContext";
import { IdentityHeader } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { IconInicio, IconConfiguracion } from "@/components/icons";

interface ComplejoListadoDto {
  id: string;
  nombre: string;
  activo: boolean;
}
interface UsuarioListadoDto {
  id: string;
  complejoId: string | null;
}
interface TerrenoListadoDto {
  id: string;
  complejoId: string;
}
interface PagoServicioListadoDto {
  id: string;
  complejoId: string;
  periodo: string; // "YYYY-MM-DD"
  pagado: boolean;
}

function primerDiaMesActual(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function HomeSuperAdminPage() {
  const { usuario } = useAuth();
  const [complejos, setComplejos] = useState<ComplejoListadoDto[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioListadoDto[]>([]);
  const [terrenos, setTerrenos] = useState<TerrenoListadoDto[]>([]);
  const [pagos, setPagos] = useState<PagoServicioListadoDto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

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
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los complejos.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crearComplejo() {
    if (!nombreNuevo.trim()) {
      setErrorForm("El nombre es requerido.");
      return;
    }
    setGuardando(true);
    setErrorForm(null);
    try {
      await api.post("/api/complejos", { nombre: nombreNuevo.trim() });
      setNombreNuevo("");
      setMostrarForm(false);
      await cargar();
    } catch (err) {
      setErrorForm(err instanceof ApiError ? err.message : "No se pudo crear el complejo.");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <p className="cargando">Cargando...</p>;

  const periodoActual = primerDiaMesActual();

  return (
    <div className="app-shell">
      <IdentityHeader
        nombre="Super Admin"
        subtitulo={`${complejos.filter((c) => c.activo).length} complejos activos`}
        iniciales="SA"
        ayuda="Acá ves todos los complejos clientes y si están al día con el pago del servicio. Tocá uno para ver y gestionar sus usuarios."
      />

      <main className="app-main">
        {usuario && (
          <p className="text-muted" style={{ margin: 0, fontSize: 15 }}>
            {saludoPorHora()}, {usuario.nombre.split(" ")[0]}
          </p>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: 26, margin: "4px 0 0 0" }}>Complejos</h1>
          <button
            type="button"
            aria-label="Nuevo complejo"
            onClick={() => setMostrarForm((v) => !v)}
            style={{
              background: "var(--accent-fill)",
              color: "var(--on-accent)",
              border: "none",
              borderRadius: "999px",
              width: 42,
              height: 42,
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            +
          </button>
        </div>

        {mostrarForm && (
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label>Nombre del complejo</label>
            <input
              className="input"
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              placeholder="Ej: Complejo Demo FC"
            />
            {errorForm && <p style={{ color: "var(--error)", fontSize: 13.5, margin: 0 }}>{errorForm}</p>}
            <button type="button" className="btn-primary" disabled={guardando} onClick={crearComplejo}>
              {guardando ? "Creando..." : "Crear complejo"}
            </button>
          </div>
        )}

        {error && <p style={{ color: "var(--error)" }}>{error}</p>}

        {complejos.length === 0 && !error && (
          <p className="text-muted">Todavía no hay complejos creados.</p>
        )}

        {complejos.map((c) => {
          const usuariosCount = usuarios.filter((u) => u.complejoId === c.id).length;
          const terrenosCount = terrenos.filter((t) => t.complejoId === c.id).length;
          const pagoActual = pagos.find((p) => p.complejoId === c.id && p.periodo.startsWith(periodoActual.slice(0, 7)));
          const alDia = !!pagoActual?.pagado;

          return (
            <Link key={c.id} href={`/admin/superadmin/complejos/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, fontSize: 16.5 }}>{c.nombre}</span>
                  <span className={`pill ${alDia ? "pill-ok" : "pill-warn"}`}>{alDia ? "AL DÍA" : "ATRASADO"}</span>
                </div>
                <div className="text-muted" style={{ fontSize: 13.5, marginTop: 5 }}>
                  {usuariosCount} usuarios · {terrenosCount} terreno{terrenosCount === 1 ? "" : "s"}
                </div>
              </div>
            </Link>
          );
        })}
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