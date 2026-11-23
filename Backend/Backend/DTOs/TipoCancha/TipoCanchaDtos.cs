namespace Backend.DTOs.TipoCancha;

public class TipoCanchaListadoDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int JugadoresPorEquipo { get; set; }
    public decimal PrecioPorHora { get; set; }
    public bool Activo { get; set; }

    // Mismo motivo que en TerrenoListadoDto: agrupar por complejo en el
    // front de SuperAdmin sin N+1. RLS sigue siendo el único filtro real.
    public Guid ComplejoId { get; set; }
}

public class TipoCanchaDetalleDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int JugadoresPorEquipo { get; set; }
    public decimal PrecioPorHora { get; set; }
    public bool Activo { get; set; }
    public Guid ComplejoId { get; set; }
    public DateTimeOffset CreadoEn { get; set; }
}

public class TipoCanchaCrearDto
{
    public string Nombre { get; set; } = string.Empty;
    public int JugadoresPorEquipo { get; set; }
    public decimal PrecioPorHora { get; set; }
    public Guid ComplejoId { get; set; }
}

// Edición COMPLETA -> solo SuperAdmin
public class TipoCanchaActualizarDto
{
    public string Nombre { get; set; } = string.Empty;
    public int JugadoresPorEquipo { get; set; }
    public decimal PrecioPorHora { get; set; }
    public bool Activo { get; set; }
}

// Edición acotada -> SuperAdmin o AdminComplejo (solo precio)
public class TipoCanchaActualizarPrecioDto
{
    public decimal PrecioPorHora { get; set; }
}