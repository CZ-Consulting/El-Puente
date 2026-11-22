using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class Configuracion
{
    [Key]
    public Guid Id { get; set; }

    public Guid ComplejoId { get; set; }
    public Complejo? Complejo { get; set; }

    public Guid TerrenoId { get; set; }
    public Terreno? Terreno { get; set; }

    [Required, MaxLength(200)]
    public string Nombre { get; set; } = string.Empty;

    public DateTimeOffset CreadoEn { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<ConfiguracionItem> Items { get; set; } = new List<ConfiguracionItem>();
}