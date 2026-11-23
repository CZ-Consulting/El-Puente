import type { Viewport } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

export const metadata = {
  title: "El Puente · Gestión de Canchas",
};

// viewportFit: "cover" es lo que hace que env(safe-area-inset-bottom) deje
// de valer 0 en iOS (la barra de gestos de abajo) — sin esto, el padding
// extra que le agregamos al bottom-nav en globals.css no tiene efecto.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* Misma tipografía del wireframe aprobado por el cliente. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=DM+Sans:wght@400;500;700&display=swap"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}