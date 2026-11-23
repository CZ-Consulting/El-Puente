"use client";

// app/olvide-password/page.tsx
//
// Primer paso del flujo de "olvidé mi contraseña": el usuario pone su email,
// se llama a POST /api/auth/olvide-password, y se muestra SIEMPRE el mismo
// mensaje de éxito (exista o no ese email) -- el backend ya sigue el mismo
// criterio, para no confirmar qué emails están registrados. Pública: hay que
// agregarla a RUTAS_PUBLICAS en middleware.ts.

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function OlvidePasswordPage() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post("/api/auth/olvide-password", { email });
    } catch {
      // Igual mostramos el mensaje de éxito: no hay nada que el usuario
      // pueda hacer distinto si falla silenciosamente del lado del server,
      // y no queremos filtrar si el email existe o no a través del error.
    } finally {
      setEnviando(false);
      setEnviado(true);
    }
  }

  return (
    <div className="app-shell">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "24px 28px 40px 28px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, margin: "8px 0 0 0", textAlign: "center" }}>¿Olvidaste tu contraseña?</h1>
          <p className="text-muted" style={{ margin: 0, fontSize: 16, textAlign: "center" }}>
            Ingresá tu email y te mandamos un link para elegir una nueva.
          </p>
        </div>

        {enviado ? (
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: 0, fontSize: 15.5 }}>
              Si <strong>{email}</strong> está registrado en el sistema, te llega un mail con el link para
              restablecer tu contraseña. Revisá también la carpeta de spam.
            </p>
            <Link href="/login" className="btn-primary" style={{ textAlign: "center", textDecoration: "none" }}>
              Volver al login
            </Link>
          </div>
        ) : (
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

            <button type="submit" disabled={enviando} className="btn-primary">
              {enviando ? "Enviando..." : "Enviar link"}
            </button>

            <Link
              href="/login"
              style={{ textAlign: "center", fontSize: 14.5, color: "var(--accent)", textDecoration: "none" }}
            >
              Volver al login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}