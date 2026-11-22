"use client";

// contexts/AuthContext.tsx
//
// Contexto global de sesión. Al montar la app, si hay un token guardado,
// llama a GET /api/auth/me para traer el usuario actual real desde el
// backend (no confía solo en lo que dice el JWT decodificado) — así el
// usuario puede refrescar la página sin tener que loguearse de nuevo, y si
// el usuario fue desactivado o cambiaron su rol, se refleja al toque.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/auth";

export type Rol = "SuperAdmin" | "AdminComplejo" | "Recepcionista" | "Preparador";

export interface UsuarioActual {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  complejoId: string | null;
}

interface LoginResponse {
  token: string;
  usuario: UsuarioActual;
}

interface AuthContextValue {
  usuario: UsuarioActual | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setCargando(false);
      return;
    }

    api
      .get<UsuarioActual>("/api/auth/me")
      .then((data) => setUsuario(data))
      .catch(() => {
        // Token inválido o vencido: api.ts ya se encarga de limpiarlo y
        // redirigir si corresponde. Acá solo nos asegurarnos de no dejar
        // al contexto en un estado inconsistente.
        setUsuario(null);
      })
      .finally(() => setCargando(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api.post<LoginResponse>("/api/auth/login", { email, password });
      setToken(data.token);
      setUsuario(data.usuario);
    },
    [],
  );

  const logout = useCallback(() => {
    clearToken();
    setUsuario(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({ usuario, cargando, login, logout }),
    [usuario, cargando, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

export { ApiError };