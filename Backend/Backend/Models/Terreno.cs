using Microsoft.Extensions.Configuration;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class Terreno
{
    [Key]
    public Guid Id { get; set; }

    public Guid ComplejoId { get; set; }
    public Complejo? Complejo { get; set; }

    [Required, MaxLength(200)]
    public string Nombre { get; set; } = string.Empty;

    public DateTimeOffset CreadoEn { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<Configuracion> Configuraciones { get; set; } = new List<Configuracion>();
}