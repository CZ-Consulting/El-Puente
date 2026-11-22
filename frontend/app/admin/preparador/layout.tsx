import { RequireRol } from "@/components/RequireRol";

// Visualizador operativo: su usuario principal es el Preparador, pero es de
// solo lectura, así que no hay problema en que también lo vean
// AdminComplejo/SuperAdmin si navegan hasta acá.
export default function PreparadorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRol roles={["Preparador", "AdminComplejo", "SuperAdmin"]}>{children}</RequireRol>
  );
}