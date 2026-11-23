"use client";

// app/admin/complejo/dashboard/page.tsx — réplica de Dashboard.dc.html
//
// El cuerpo (chips de período, totales, desgloses) vive en
// components/RecaudacionDashboard.tsx, compartido con la versión que ve el
// SuperAdmin para un complejo puntual (app/admin/superadmin/complejos/[id]/dashboard).
// Acá no pasamos complejoId: RLS ya acota los datos al complejo del usuario
// logueado (ver TenantContextMiddleware).

import { useAuth } from "@/contexts/AuthContext";
import { iniciales } from "@/lib/texto";
import { SectionHeader } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { RecaudacionDashboard } from "@/components/RecaudacionDashboard";
import { IconInicio, IconDashboard, IconPrecios } from "@/components/icons";

const NAV_ITEMS = [
  { href: "/admin/complejo", label: "Inicio", icon: <IconInicio /> },
  { href: "/admin/complejo/dashboard", label: "Dashboard", icon: <IconDashboard /> },
  { href: "/admin/complejo/precios", label: "Precios", icon: <IconPrecios /> },
];

export default function DashboardComplejoPage() {
  const { usuario } = useAuth();

  return (
    <div className="app-shell">
      <SectionHeader
        titulo="Dashboard"
        iniciales={usuario ? iniciales(usuario.nombre) : undefined}
        ayuda="Elegí un período (día, semana, mes, trimestre o un rango propio) para ver cuánto recaudó tu complejo."
      />

      <main className="app-main">
        <RecaudacionDashboard />
      </main>

      <BottomNav items={NAV_ITEMS} />
    </div>
  );
}