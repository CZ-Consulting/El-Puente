namespace Backend.DTOs.Terreno;

public class TerrenoListadoDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;

    // Agregado para que SuperAdmin pueda agrupar terrenos por complejo en el
    // front sin tener que pedir el detalle de cada uno (N+1). RLS ya filtra
    // qué filas ve cada rol, así que exponer este campo no agrega ningún
    // acceso nuevo: AdminComplejo/Recepcionista/Preparador solo verían el
    // suyo de todas formas.
    public Guid ComplejoId { get; set; }
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