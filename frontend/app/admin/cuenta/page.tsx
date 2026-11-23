"use client";

// app/admin/cuenta/page.tsx — pantalla "Cuenta"
//
// Antes, tocar "Cuenta" en la nav inferior cerraba la sesión directo (así
// estaba en el wireframe original). El cliente pidió un cambio: ahora abre
// esta pantalla con opciones — cambiar contraseña, cerrar sesión, o
// contactar a CZ Consulting por WhatsApp para reportar un error. Es una
// ruta compartida por los 4 roles (no tiene layout.tsx propio con RequireRol
// porque no hace falta: alcanza con estar logueado, que ya lo garantiza
// middleware.ts), por eso el encabezado se arma con el rol real del usuario.

import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiError } from "@/lib/api";
import { iniciales } from "@/lib/texto";
import { SUBTITULO_POR_ROL, navItemsPorRol } from "@/lib/navegacionPorRol";
import { IdentityHeader } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";

// Número de soporte de CZ Consulting. wa.me no acepta "+" ni espacios/guiones.
const WHATSAPP_SOPORTE = "5491124876248";

export default function CuentaPage() {
  const { usuario, logout } = useAuth();

  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  if (!usuario) return null;

  async function cambiarPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setExito(false);

    if (passwordNueva.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (passwordNueva !== passwordConfirmar) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setGuardando(true);
    try {
      await api.patch("/api/auth/cambiar-password", {
        passwordActual,
        passwordNueva,
      });
      setExito(true);
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirmar("");
      setMostrarCambioPassword(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cambiar la contraseña.");
    } finally {
      setGuardando(false);
    }
  }

  function cerrarSesion() {
    if (window.confirm("¿Cerrar sesión?")) logout();
  }

  const mensajeWhatsapp = encodeURIComponent(
    `Hola, soy ${usuario.nombre} (${SUBTITULO_POR_ROL[usuario.rol]}) y quiero reportar un problema en el sistema de gestión de canchas.`,
  );

  return (
    <div className="app-shell">
      <IdentityHeader
        nombre={usuario.nombre}
        subtitulo={SUBTITULO_POR_ROL[usuario.rol]}
        iniciales={iniciales(usuario.nombre)}
        ayuda="Desde acá podés cambiar tu contraseña, cerrar sesión, o contactar a soporte si encontrás un error en el sistema."
      />

      <main className="app-main">
        <h1 style={{ fontSize: 26, margin: "4px 0 0 0" }}>Cuenta</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="text-muted" style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Sesión iniciada como
            </span>
            <span className="font-display" style={{ fontSize: 19 }}>
              {usuario.nombre}
            </span>
            <span className="text-muted" style={{ fontSize: 14 }}>
              {usuario.email} · {SUBTITULO_POR_ROL[usuario.rol]}
            </span>
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: 15.5 }}>Cambiar contraseña</span>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setMostrarCambioPassword((v) => !v);
                  setError(null);
                  setExito(false);
                }}
              >
                {mostrarCambioPassword ? "Cancelar" : "Cambiar"}
              </button>
            </div>

            {exito && (
              <p style={{ color: "var(--ok)", fontSize: 14, margin: 0 }}>Contraseña actualizada.</p>
            )}

            {mostrarCambioPassword && (
              <form onSubmit={cambiarPassword} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  type="password"
                  placeholder="Contraseña actual"
                  className="input"
                  autoComplete="current-password"
                  required
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Contraseña nueva (mín. 6 caracteres)"
                  className="input"
                  autoComplete="new-password"
                  required
                  value={passwordNueva}
                  onChange={(e) => setPasswordNueva(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Confirmar contraseña nueva"
                  className="input"
                  autoComplete="new-password"
                  required
                  value={passwordConfirmar}
                  onChange={(e) => setPasswordConfirmar(e.target.value)}
                />
                {error && (
                  <p role="alert" style={{ color: "var(--error)", fontSize: 14, margin: 0 }}>
                    {error}
                  </p>
                )}
                <button type="submit" disabled={guardando} className="btn-primary">
                  {guardando ? "Guardando..." : "Guardar nueva contraseña"}
                </button>
              </form>
            )}
          </div>

          <a
            href={`https://wa.me/${WHATSAPP_SOPORTE}?text=${mensajeWhatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="card"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              textDecoration: "none",
              color: "var(--ink)",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 15.5 }}>Reportar un error</div>
              <div className="text-muted" style={{ fontSize: 13.5, marginTop: 2 }}>
                Contactar a CZ Consulting por WhatsApp
              </div>
            </div>
            <span className="text-muted" style={{ fontSize: 22 }}>↗</span>
          </a>

          <button type="button" onClick={cerrarSesion} className="btn-cancelar-reserva" style={{ marginTop: 4 }}>
            Cerrar sesión
          </button>
        </div>
      </main>

      <BottomNav items={navItemsPorRol(usuario.rol)} />
    </div>
  );
}