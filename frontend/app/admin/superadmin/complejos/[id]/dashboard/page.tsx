"use client";

// app/admin/superadmin/complejos/[id]/dashboard/page.tsx — dashboard
// operativo de UN complejo puntual, visto por el SuperAdmin. Reusa el mismo
// cuerpo (components/RecaudacionDashboard) que ve el AdminComplejo, pero acá
// sí le pasamos complejoId explícito: el SuperAdmin no tiene un complejo
// propio en el JWT, así que RLS no lo acota solo y hay que filtrar a mano
// (el backend ya soportaba "GET /api/reportes/recaudacion?complejoId=...").

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { SectionHeader } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { RecaudacionDashboard } from "@/components/RecaudacionDashboard";
import { IconInicio, IconConfiguracion } from "@/components/icons";

interface ComplejoListadoDto {
  id: string;
  nombre: string;
  activo: boolean;
}

export default function DashboardComplejoSuperAdminPage() {
  const { id } = useParams<{ id: string }>();
  const [complejo, setComplejo] = useState<ComplejoListadoDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ComplejoListadoDto[]>("/api/complejos")
      .then((lista) => setComplejo(lista.find((c) => c.id === id) ?? null))
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudo cargar el complejo."));
  }, [id]);

  return (
    <div className="app-shell">
      <SectionHeader
        titulo={complejo ? `Dashboard · ${complejo.nombre}` : "Dashboard"}
        backHref={`/admin/superadmin/complejos/${id}`}
        ayuda="Mismo dashboard operativo que ve el Admin de este complejo: elegí un período para ver cuánto recaudó."
      />

      <main className="app-main">
        {error && (
          <p className="text-muted" style={{ color: "var(--error)" }}>
            {error}
          </p>
        )}
        <RecaudacionDashboard complejoId={Array.isArray(id) ? id[0] : id} />
      </main>

      <BottomNav
        items={[
          { href: "/admin/superadmin", label: "Complejos", icon: <IconInicio /> },
          { href: "/admin/superadmin/configuracion", label: "Configuración", icon: <IconConfiguracion /> },
        ]}
      />
    </div>
  );
}