// lib/tiempo.ts
// Helpers chiquitos para trabajar con fecha/hora locales en los formularios
// (inputs nativos date/time) sin arrastrar una librería de fechas para esto.

export function fechaHoyLocal(): string {
  const ahora = new Date();
  const yyyy = ahora.getFullYear();
  const mm = String(ahora.getMonth() + 1).padStart(2, "0");
  const dd = String(ahora.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Hora actual redondeada hacia abajo a la hora en punto, formato "HH:mm". */
export function horaActualRedondeada(): string {
  const ahora = new Date();
  return `${String(ahora.getHours()).padStart(2, "0")}:00`;
}

export function sumarHoras(
  fecha: string,
  horaHHmm: string,
  horas: number,
): { fecha: string; hora: string } {
  const [h, m] = horaHHmm.split(":").map(Number);
  const base = new Date(`${fecha}T00:00:00`);
  base.setHours(h, m, 0, 0);
  base.setTime(base.getTime() + horas * 60 * 60 * 1000);

  const yyyy = base.getFullYear();
  const mm = String(base.getMonth() + 1).padStart(2, "0");
  const dd = String(base.getDate()).padStart(2, "0");
  const hh = String(base.getHours()).padStart(2, "0");
  const mi = String(base.getMinutes()).padStart(2, "0");

  return { fecha: `${yyyy}-${mm}-${dd}`, hora: `${hh}:${mi}` };
}

/** El backend puede devolver "14:00:00" o "14:00:00.0000000" según el caso; nos quedamos solo con "HH:mm". */
export function horaCorta(valorBackend: string): string {
  return valorBackend.slice(0, 5);
}

/** "HH:mm" -> minutos desde las 00:00 de ese mismo día. */
export function minutosDesdeMedianoche(horaHHmm: string): number {
  const [h, m] = horaHHmm.split(":").map(Number);
  return h * 60 + m;
}

// Comparar horarios como texto (o incluso como minutos "a secas") se rompe
// justo en el último turno del día: un rango que termina a la medianoche
// (ej. 23:00 a 00:00) guarda "00:00" como hora_fin, y "00:00" siempre da
// MENOR que cualquier otra hora del mismo día -- nunca mayor -- porque no
// existe un "24:00". Si "fin" queda en o antes de "inicio" es justamente
// por eso: hay que interpretarlo como fin del día (24:00 = 1440 minutos),
// no como las 00:00 literales. Misma regla que en el backend
// (ReservaService.MinutosFinDia) para que ambos lados coincidan.
export function minutosFinDia(finHHmm: string, inicioHHmm: string): number {
  const finMin = minutosDesdeMedianoche(finHHmm);
  const inicioMin = minutosDesdeMedianoche(inicioHHmm);
  return finMin <= inicioMin ? 1440 : finMin;
}

/** "Buenos días" / "Buenas tardes" / "Buenas noches" según la hora local del dispositivo. */
export function saludoPorHora(): string {
  const hora = new Date().getHours();
  if (hora < 6) return "Buenas noches";
  if (hora < 12) return "Buenos días";
  if (hora < 20) return "Buenas tardes";
  return "Buenas noches";
}

/** "2026-11-20" -> "Jueves 20 de noviembre", como en el wireframe. */
export function fechaLarga(fecha: string): string {
  const d = new Date(`${fecha}T00:00:00`);
  const texto = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}