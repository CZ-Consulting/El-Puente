using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class Complejo
{
    [Key]
    public Guid Id { get; set; }

    [Required, MaxLength(200)]
    public string Nombre { get; set; } = string.Empty;

    public string? Direccion { get; set; }
    public string? Telefono { get; set; }
    public bool Activo { get; set; } = true;
    public DateTimeOffset CreadoEn { get; set; } = DateTimeOffset.UtcNow;

    // Navegación inversa (opcional, útil para Include())
    public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
    public ICollection<Terreno> Terrenos { get; set; } = new List<Terreno>();
}