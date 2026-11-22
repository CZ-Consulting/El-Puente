"use client";

// app/login/page.tsx
//
// Primera pantalla portada del wireframe. Única pública (ver middleware.ts).
// Tras loguearse, respeta el "?next=" que dejó el middleware si el usuario
// quiso entrar directo a una pantalla protegida sin sesión.

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";

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
    <main className="login-page">
      <form onSubmit={handleSubmit} className="login-card">
        <h1>Los Pinos FC</h1>
        <p className="login-subtitulo">Ingresá con tu cuenta</p>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p role="alert" className="login-error">
            {error}
          </p>
        )}

        <button type="submit" disabled={enviando}>
          {enviando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}