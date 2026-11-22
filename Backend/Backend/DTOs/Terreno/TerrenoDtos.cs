namespace Backend.DTOs.Terreno;

public class TerrenoListadoDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
}

public class TerrenoDetalleDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public Guid ComplejoId { get; set; }
    public DateTimeOffset CreadoEn { get; set; }
}

public class TerrenoCrearDto
{
    public string Nombre { get; set; } = string.Empty;
    public Guid ComplejoId { get; set; }
}

public class TerrenoActualizarDto
{
    public string Nombre { get; set; } = string.Empty;
}