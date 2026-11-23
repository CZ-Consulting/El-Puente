namespace Backend.DTOs.Reporte;

public class RecaudacionPorDiaDto
{
    public DateOnly Fecha { get; set; }
    public decimal Total { get; set; }
    public int CantidadReservas { get; set; }
}

public class RecaudacionPorTipoCanchaDto
{
    public Guid TipoCanchaId { get; set; }
    public string TipoCanchaNombre { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public int CantidadReservas { get; set; }
}

public class RecaudacionDto
{
    public DateOnly Desde { get; set; }
    public DateOnly Hasta { get; set; }
    public decimal Total { get; set; }
    public int CantidadReservas { get; set; }
    public List<RecaudacionPorDiaDto> PorDia { get; set; } = new();
    public List<RecaudacionPorTipoCanchaDto> PorTipoCancha { get; set; } = new();
}

// Vista comparativa para el SuperAdmin: recaudación de TODOS los complejos
// lado a lado en el mismo rango de fechas, para decidir mensualidades
// adaptadas a los ingresos reales de cada uno.
public class RecaudacionComplejoDto
{
    public Guid ComplejoId { get; set; }
    public string ComplejoNombre { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public int CantidadReservas { get; set; }
}