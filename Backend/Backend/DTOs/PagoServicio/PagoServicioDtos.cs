namespace Backend.DTOs.PagoServicio;

public class PagoServicioListadoDto
{
    public Guid Id { get; set; }
    public Guid ComplejoId { get; set; }
    public string ComplejoNombre { get; set; } = string.Empty;
    public DateOnly Periodo { get; set; }
    public bool Pagado { get; set; }
    public decimal? Monto { get; set; }
}

public class PagoServicioCrearDto
{
    public Guid ComplejoId { get; set; }
    public DateOnly Periodo { get; set; } // primer día del mes
    public decimal? Monto { get; set; }
}

public class PagoServicioMarcarPagadoDto
{
    public DateOnly FechaPago { get; set; }
    public decimal? Monto { get; set; }
}