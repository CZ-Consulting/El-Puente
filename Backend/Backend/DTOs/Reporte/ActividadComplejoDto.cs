namespace Backend.DTOs.Reporte;

public class ActividadComplejoDto
{
    public Guid ComplejoId { get; set; }
    public string ComplejoNombre { get; set; } = string.Empty;
    public bool Activo { get; set; }

    public int CantidadUsuariosActivos { get; set; }
    public int CantidadReservasUltimos30Dias { get; set; }

    public DateTimeOffset? FechaUltimaReserva { get; set; }
    public DateTimeOffset? FechaUltimoLogin { get; set; }

    // Días desde la última señal de actividad (la más reciente entre
    // "última reserva cargada" y "último login"). Null = nunca tuvo actividad.
    public int? DiasSinActividad { get; set; }

    // true si pasó el umbral configurado (ver ReporteService) sin ninguna
    // actividad -> candidato a contactar para onboarding/retención.
    public bool EnRiesgoDeChurn { get; set; }
}