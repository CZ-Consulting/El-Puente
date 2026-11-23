"use client";

// app/restablecer-password/page.tsx
//
// Segundo paso del flujo: la persona llega acá desde el link del mail
// (?token=...), pone su contraseña nueva, y se llama a
// POST /api/auth/restablecer-password. Pública: hay que agregarla a
// RUTAS_PUBLICAS en middleware.ts.
//
// useSearchParams() necesita un límite de Suspense en el App Router (mismo
// motivo que en app/login/page.tsx), si no Next.js tira error en el build.

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";

export default function RestablecerPasswordPage() {
  return (
    <Suspense fallback={null}>
      <RestablecerPasswordForm />
    </Suspense>
  );
}

function RestablecerPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (passwordNueva.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (passwordNueva !== passwordConfirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    try {
      await api.post("/api/auth/restablecer-password", { token, passwordNueva });
      setExito(true);
      setTimeout(() => router.replace("/login"), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo restablecer la contraseña.");
    } finally {
      setEnviando(false);
    }
  }

  if (!token) {
    return (
      <div className="app-shell">
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "24px 28px 40px 28px" }}>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: 0, fontSize: 15.5 }}>
              Este link no es válido. Pedí uno nuevo desde la pantalla de login.
            </p>
            <Link href="/olvide-password" className="btn-primary" style={{ textAlign: "center", textDecoration: "none" }}>
              Pedir un link nuevo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "24px 28px 40px 28px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, margin: "8px 0 0 0", textAlign: "center" }}>Elegí tu nueva contraseña</h1>
        </div>

        {exito ? (
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: 0, fontSize: 15.5, color: "var(--ok)" }}>
              Contraseña actualizada. Ya podés iniciar sesión con ella.
            </p>
            <Link href="/login" className="btn-primary" style={{ textAlign: "center", textDecoration: "none" }}>
              Ir al login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <label htmlFor="passwordNueva">Contraseña nueva</label>
              <input
                id="passwordNueva"
                type="password"
                placeholder="Mínimo 6 caracteres"
                className="input"
                autoComplete="new-password"
                required
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <label htmlFor="passwordConfirmar">Confirmar contraseña</label>
              <input
                id="passwordConfirmar"
                type="password"
                placeholder="Repetí la contraseña"
                className="input"
                autoComplete="new-password"
                required
                value={passwordConfirmar}
                onChange={(e) => setPasswordConfirmar(e.target.value)}
              />
            </div>

            {error && (
              <p role="alert" style={{ color: "var(--error)", fontSize: 14, margin: 0 }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={enviando} className="btn-primary">
              {enviando ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}