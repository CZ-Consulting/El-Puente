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

// Edición: reemplaza nombre + TODOS los items de una (borra los viejos,
// inserta los nuevos) — más simple y seguro que un diff incremental, y
// coincide con cómo lo arma el frontend (ajustás cantidades localmente con
// +/- y recién mandás todo junto al tocar "Guardar").
public class ConfiguracionActualizarDto
{
    public string Nombre { get; set; } = string.Empty;
    public List<ConfiguracionItemCrearDto> Items { get; set; } = new();
}