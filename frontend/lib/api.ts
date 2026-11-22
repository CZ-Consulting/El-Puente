// lib/api.ts
//
// Cliente HTTP único para hablar con la API del backend. Centraliza: la URL
// base, el header Authorization con el JWT, el manejo de 401 (sesión vencida
// -> limpiar token y mandar a /login) y la extracción del mensaje de error
// legible que manda ErrorHandlingMiddleware (campo "error" en el JSON).
//
// Todas las pantallas deberían llamar a la API a través de este módulo, no
// con fetch directo, para no repetir esta lógica en cada componente.

import { getToken, clearToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:7000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

type Metodo = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiOptions {
  method?: Metodo;
  body?: unknown;
  // Query params simples, ej. { desde: "2026-11-01", hasta: "2026-11-30" }
  params?: Record<string, string | number | boolean | undefined>;
}

function construirUrl(path: string, params?: ApiOptions["params"]): string {
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    for (const [clave, valor] of Object.entries(params)) {
      if (valor !== undefined && valor !== null && valor !== "") {
        url.searchParams.set(clave, String(valor));
      }
    }
  }
  return url.toString();
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = getToken();
  const url = construirUrl(path, options.params);

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  // Sesión vencida o token inválido/ausente para un endpoint protegido:
  // limpiamos y mandamos directo al login. No tiene sentido mostrar un
  // error genérico acá, la acción correcta es siempre volver a loguearse.
  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Tu sesión expiró. Volvé a iniciar sesión.");
  }

  if (!res.ok) {
    let mensaje = `Ocurrió un error (${res.status}).`;
    try {
      const data = await res.json();
      // "error" es el campo que manda ErrorHandlingMiddleware para las
      // excepciones de negocio (ej. "No hay disponibilidad...", "Se generó
      // un conflicto con otra reserva simultánea..."). "title" es el
      // fallback para los 400 de validación automática de [ApiController].
      mensaje = data.error ?? data.title ?? mensaje;
    } catch {
      // sin body JSON parseable, nos quedamos con el mensaje genérico
    }
    throw new ApiError(res.status, mensaje);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, params?: ApiOptions["params"]) =>
    apiFetch<T>(path, { method: "GET", params }),
  post: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};