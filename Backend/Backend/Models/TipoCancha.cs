using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public class TipoCancha
{
    [Key]
    public Guid Id { get; set; }

    public Guid ComplejoId { get; set; }
    public Complejo? Complejo { get; set; }

    [Required, MaxLength(200)]
    public string Nombre { get; set; } = string.Empty;

    public int JugadoresPorEquipo { get; set; }

    [Column(TypeName = "numeric(10,2)")]
    public decimal PrecioPorHora { get; set; }

    public bool Activo { get; set; } = true;
    public DateTimeOffset CreadoEn { get; set; } = DateTimeOffset.UtcNow;
}