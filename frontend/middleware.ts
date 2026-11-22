// middleware.ts (raíz del proyecto frontend, al lado de package.json)
//
// Protección de rutas a nivel servidor: si no hay token de sesión, redirige
// a /login. La única pantalla pública es /login (y los assets estáticos).
// Esto es la primera capa (UX: no mostrar pantallas vacías/rotas sin login);
// la segunda y verdadera capa de seguridad sigue siendo el backend
// (401/403/RLS) — este middleware no decide permisos por rol, eso lo filtra
// cada pantalla/componente según el usuario que devuelve GET /api/auth/me.
//
// Lección aplicada (ver arquitectura-stack.md): la ruta de login SIEMPRE
// tiene que quedar excluida de la protección, o nadie puede loguearse.

import { NextResponse, type NextRequest } from "next/server";

const TOKEN_COOKIE = "lp_token";

const RUTAS_PUBLICAS = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const esRutaPublica = RUTAS_PUBLICAS.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`),
  );
  if (esRutaPublica) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Corre en todo excepto assets estáticos de Next y el favicon.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};