namespace Backend.DTOs.Usuario;

public class UsuarioListadoDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public bool Activo { get; set; }

    // Nullable porque un SuperAdmin no pertenece a ningún complejo.
    // Mismo motivo que en TerrenoListadoDto/TipoCanchaListadoDto.
    public Guid? ComplejoId { get; set; }
}

public class UsuarioDetalleDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public Guid? ComplejoId { get; set; }
    public bool Activo { get; set; }
    public DateTimeOffset CreadoEn { get; set; }
}

public class UsuarioCrearDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;

    // "SuperAdmin" | "AdminComplejo" | "Recepcionista" | "Preparador"
    public string Rol { get; set; } = string.Empty;

    // Requerido salvo que Rol == "SuperAdmin". Si quien crea es AdminComplejo,
    // el service IGNORA este valor y fuerza su propio complejo (ver UsuarioService).
    public Guid? ComplejoId { get; set; }
}

public class UsuarioActualizarDto
{
    public string Nombre { get; set; } = string.Empty;
    public bool Activo { get; set; }
}