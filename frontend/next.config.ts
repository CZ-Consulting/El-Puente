import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // El indicador de Next.js en modo dev (el circulito "N" abajo a la
  // izquierda) queda exactamente arriba del primer ítem del bottom-nav de
  // la app (Inicio/Complejos) y se come los clics ahí. Es solo de
  // desarrollo — no aparece en producción — pero mientras tanto molesta
  // la UX, así que lo desactivamos.
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;