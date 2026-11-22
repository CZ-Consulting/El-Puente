using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class Usuario
{
    [Key]
    public Guid Id { get; set; }

    // Null solo si Rol == "SuperAdmin" (constraint usuario_rol_complejo_chk en SQL)
    public Guid? ComplejoId { get; set; }
    public Complejo? Complejo { get; set; }

    [Required, MaxLength(200)]
    public string Nombre { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    // "SuperAdmin" | "AdminComplejo" | "Recepcionista" | "Preparador"
    [Required, MaxLength(30)]
    public string Rol { get; set; } = string.Empty;

    public bool Activo { get; set; } = true;
    public DateTimeOffset CreadoEn { get; set; } = DateTimeOffset.UtcNow;

    // Se actualiza en cada login exitoso (ver AuthService). Alimenta el
    // dashboard de actividad/churn que ve el SuperAdmin.
    public DateTimeOffset? UltimoLogin { get; set; }
}