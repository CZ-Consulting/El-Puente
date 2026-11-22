namespace Backend.DTOs.Auth;

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public DateTimeOffset ExpiraEn { get; set; }
    public UsuarioLogueadoDto Usuario { get; set; } = null!;
}

// Lo que el frontend necesita mostrar tras loguear (nombre, rol, complejo)
// SIN exponer el password_hash ni otros campos sensibles.
public class UsuarioLogueadoDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public Guid? ComplejoId { get; set; }
}