using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public class Reserva
{
    [Key]
    public Guid Id { get; set; }

    public Guid ComplejoId { get; set; }
    public Complejo? Complejo { get; set; }

    public Guid TerrenoId { get; set; }
    public Terreno? Terreno { get; set; }

    public Guid TipoCanchaId { get; set; }
    public TipoCancha? TipoCancha { get; set; }

    public DateOnly Fecha { get; set; }
    public TimeOnly HoraInicio { get; set; }
    public TimeOnly HoraFin { get; set; }

    public string? ClienteNombre { get; set; }
    public string? ClienteTelefono { get; set; }

    [Column(TypeName = "numeric(10,2)")]
    public decimal PrecioTotal { get; set; }

    public bool SenaPagada { get; set; }

    [Column(TypeName = "numeric(10,2)")]
    public decimal? SenaMonto { get; set; }

    // "efectivo" | "transferencia" | null
    public string? SenaMetodo { get; set; }

    // "confirmada" | "cancelada"
    [Required, MaxLength(30)]
    public string Estado { get; set; } = "confirmada";

    public Guid? CreadoPor { get; set; }
    public Usuario? CreadoPorUsuario { get; set; }

    public DateTimeOffset CreadoEn { get; set; } = DateTimeOffset.UtcNow;
}