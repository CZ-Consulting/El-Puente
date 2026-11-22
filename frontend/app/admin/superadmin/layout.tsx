import { RequireRol } from "@/components/RequireRol";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <RequireRol roles={["SuperAdmin"]}>{children}</RequireRol>;
}