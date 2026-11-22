namespace Backend.DTOs.Reserva;

public class ReservaListadoDto
{
    public Guid Id { get; set; }
    public Guid TerrenoId { get; set; }
    public Guid TipoCanchaId { get; set; }
    public string TipoCanchaNombre { get; set; } = string.Empty;
    public DateOnly Fecha { get; set; }
    public TimeOnly HoraInicio { get; set; }
    public TimeOnly HoraFin { get; set; }
    public string? ClienteNombre { get; set; }
    public decimal PrecioTotal { get; set; }
    public string Estado { get; set; } = string.Empty;
}

public class ReservaDetalleDto : ReservaListadoDto
{
    public string? ClienteTelefono { get; set; }
    public bool SenaPagada { get; set; }
    public decimal? SenaMonto { get; set; }
    public string? SenaMetodo { get; set; }
    public Guid? CreadoPor { get; set; }
    public DateTimeOffset CreadoEn { get; set; }
}

public class ReservaCrearDto
{
    public Guid TerrenoId { get; set; }
    public Guid TipoCanchaId { get; set; }
    public DateOnly Fecha { get; set; }
    public TimeOnly HoraInicio { get; set; }
    public TimeOnly HoraFin { get; set; }
    public string? ClienteNombre { get; set; }
    public string? ClienteTelefono { get; set; }
    public bool SenaPagada { get; set; }
    public decimal? SenaMonto { get; set; }
    public string? SenaMetodo { get; set; } // "efectivo" | "transferencia"
}

// Para el visualizador operativo (Preparador) y para mostrar disponibilidad
// antes de confirmar una reserva.
public class DisponibilidadTipoDto
{
    public Guid TipoCanchaId { get; set; }
    public string TipoCanchaNombre { get; set; } = string.Empty;
    public int CantidadDisponible { get; set; }
}