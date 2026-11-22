import { RequireRol } from "@/components/RequireRol";

// Carga/edita/cancela reservas: Recepcionista, y también AdminComplejo o
// SuperAdmin según el backend (ReservaController permite a los tres crear y
// cancelar reservas) — nunca Preparador.
export default function RecepcionLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRol roles={["Recepcionista", "AdminComplejo", "SuperAdmin"]}>{children}</RequireRol>
  );
}