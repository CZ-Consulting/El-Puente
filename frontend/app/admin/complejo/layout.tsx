import { RequireRol } from "@/components/RequireRol";

export default function ComplejoLayout({ children }: { children: React.ReactNode }) {
  return <RequireRol roles={["AdminComplejo"]}>{children}</RequireRol>;
}