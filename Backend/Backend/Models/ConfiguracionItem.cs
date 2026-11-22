namespace Backend.Models;

// Tabla con clave primaria compuesta (configuracion_id, tipo_cancha_id)
// -> se configura en AppDbContext.OnModelCreating, no con [Key] acá.
public class ConfiguracionItem
{
    public Guid ConfiguracionId { get; set; }
    public Configuracion? Configuracion { get; set; }

    public Guid TipoCanchaId { get; set; }
    public TipoCancha? TipoCancha { get; set; }

    public Guid ComplejoId { get; set; }
    public Complejo? Complejo { get; set; }

    public int Cantidad { get; set; }
}