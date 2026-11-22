namespace Backend.DTOs.Configuracion;

public class ConfiguracionItemDto
{
    public Guid TipoCanchaId { get; set; }
    public string TipoCanchaNombre { get; set; } = string.Empty;
    public int Cantidad { get; set; }
}

public class ConfiguracionListadoDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public Guid TerrenoId { get; set; }
}

public class ConfiguracionDetalleDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public Guid TerrenoId { get; set; }
    public Guid ComplejoId { get; set; }
    public DateTimeOffset CreadoEn { get; set; }
    public List<ConfiguracionItemDto> Items { get; set; } = new();
}

public class ConfiguracionItemCrearDto
{
    public Guid TipoCanchaId { get; set; }
    public int Cantidad { get; set; }
}

public class ConfiguracionCrearDto
{
    public string Nombre { get; set; } = string.Empty;
    public Guid TerrenoId { get; set; }
    public List<ConfiguracionItemCrearDto> Items { get; set; } = new();
}