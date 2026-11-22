// lib/auth.ts
//
// Manejo del JWT en el frontend. Se guarda en una cookie (no httpOnly, porque
// la emite directamente el backend .NET vía fetch desde el browser, no una
// Route Handler de Next.js) para que el middleware.ts del servidor también
// pueda leerla y decidir si deja pasar a /admin/** o redirige a /login.
//
// Es el mismo patrón simple de SPA+JWT que ya usamos para hablar con el
// backend (CORS habilitado, sin cookies httpOnly de por medio). Si en el
// futuro se quiere subir el nivel de seguridad, el camino es mover el login
// a una Route Handler de Next.js que sí sete una cookie httpOnly — fuera de
// alcance para v1.

const TOKEN_COOKIE = "lp_token";

// Mismo tiempo de vida que el JWT que emite el backend (ver AuthService.cs).
const MAX_AGE_SEGUNDOS = 60 * 60 * 24;

export interface JwtPayload {
  sub: string; // usuario id
  rol: string;
  complejo_id: string; // "" para SuperAdmin
  exp: number;
}

export function setToken(token: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${MAX_AGE_SEGUNDOS}; samesite=lax`;
}

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function clearToken(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
}

/** Decodifica el payload del JWT sin validar la firma (eso ya lo valida el backend en cada request). Solo para leer rol/complejo_id al toque en el cliente, sin esperar el GET /me. */
export function decodeToken(token: string): JwtPayload | null {
  try {
    const payloadBase64 = token.split(".")[1];
    const json = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function tokenVencido(payload: JwtPayload): boolean {
  return Date.now() >= payload.exp * 1000;
}