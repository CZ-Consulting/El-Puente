"use client";

// app/login/page.tsx
//
// Primera pantalla portada del wireframe (Main.dc.html), ya conectada a
// POST /api/auth/login. Única pública (ver middleware.ts). Tras loguearse,
// respeta el "?next=" que dejó el middleware si el usuario quiso entrar
// directo a una pantalla protegida sin sesión.

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { HelpBanner, HelpButton, useHelpToggle } from "@/components/HelpBanner";

// useSearchParams() necesita un límite de Suspense en el App Router, si no
// Next.js tira error en el build de producción.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const help = useHelpToggle();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      await login(email, password);
      const destino = searchParams.get("next") || "/";
      router.replace(destino);
    } catch (err) {
      // Mensaje genérico a propósito: no distinguimos "email no existe" de
      // "password incorrecta" para no filtrar qué emails están registrados.
      if (err instanceof ApiError && err.status === 401) {
        setError("Email o contraseña incorrectos.");
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("No se pudo conectar con el servidor. Probá de nuevo.");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="app-shell">
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "18px 20px 0 20px" }}>
        <HelpButton onClick={help.toggle} />
      </div>

      <HelpBanner abierto={help.abierto}>
        Ingresá con el usuario y contraseña que te dio el administrador de tu complejo. Si no
        podés entrar, pedile a él que revise tu acceso desde el panel de usuarios.
      </HelpBanner>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "24px 28px 40px 28px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 40 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              background: "var(--accent-fill)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="var(--on-accent)" strokeWidth="1.6" />
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="var(--on-accent)" strokeWidth="1.6" />
            </svg>
          </div>
          <h1 style={{ fontSize: 32, margin: "8px 0 0 0", textAlign: "center" }}>Bienvenidos a El Puente</h1>
          <p className="text-muted" style={{ margin: 0, fontSize: 17, textAlign: "center" }}>
            Tu mejor opción para gestionar tu complejo deportivo
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <label htmlFor="email">Usuario o email</label>
            <input
              id="email"
              type="email"
              placeholder="nombre@complejo.com"
              className="input"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="input"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" style={{ color: "var(--error)", fontSize: 14, margin: 0 }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={enviando} className="btn-primary" style={{ marginTop: 8 }}>
            {enviando ? "Ingresando..." : "Ingresar"}
          </button>

          <Link
            href="/olvide-password"
            style={{ textAlign: "center", fontSize: 14.5, color: "var(--accent)", textDecoration: "none" }}
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </form>

        <p
          className="text-muted"
          style={{ textAlign: "center", fontSize: 11.5, opacity: 0.6, margin: "36px 0 0 0" }}
        >
          Desarrollado y mantenido por CZ Consulting
        </p>
      </div>
    </div>
  );
}