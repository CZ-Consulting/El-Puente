using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public class PagoServicio
{
    [Key]
    public Guid Id { get; set; }

    public Guid ComplejoId { get; set; }
    public Complejo? Complejo { get; set; }

    public DateOnly Periodo { get; set; }
    public bool Pagado { get; set; }
    public DateOnly? FechaPago { get; set; }

    [Column(TypeName = "numeric(10,2)")]
    public decimal? Monto { get; set; }
}