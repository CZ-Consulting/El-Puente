import { RequireRol } from "@/components/RequireRol";

// AdminComplejo ve su propio dashboard; SuperAdmin puede entrar a ver el
// mismo dashboard "parado en los zapatos" de un complejo puntual (ver
// requerimientos-dominio.md, sección Recaudación segmentada).
export default function ComplejoLayout({ children }: { children: React.ReactNode }) {
  return <RequireRol roles={["AdminComplejo", "SuperAdmin"]}>{children}</RequireRol>;
}