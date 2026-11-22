// Data/AppDbContext.cs
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Numerics;

namespace Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Complejo> Complejos => Set<Complejo>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Terreno> Terrenos => Set<Terreno>();
    public DbSet<TipoCancha> TiposCancha => Set<TipoCancha>();
    public DbSet<Configuracion> Configuraciones => Set<Configuracion>();
    public DbSet<ConfiguracionItem> ConfiguracionItems => Set<ConfiguracionItem>();
    public DbSet<Reserva> Reservas => Set<Reserva>();
    public DbSet<PagoServicio> PagosServicio => Set<PagoServicio>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ---- Nombres de tabla explícitos (singular, como en el SQL) ----
        // Con UseSnakeCaseNamingConvention, "Complejos" (DbSet) se traduciría
        // a "complejos" (plural); como la tabla real es "complejo" (singular),
        // hay que fijar el nombre a mano para cada entidad.
        modelBuilder.Entity<Complejo>().ToTable("complejo");
        modelBuilder.Entity<Usuario>().ToTable("usuario");
        modelBuilder.Entity<Terreno>().ToTable("terreno");
        modelBuilder.Entity<TipoCancha>().ToTable("tipo_cancha");
        modelBuilder.Entity<Configuracion>().ToTable("configuracion");
        modelBuilder.Entity<ConfiguracionItem>().ToTable("configuracion_item");
        modelBuilder.Entity<Reserva>().ToTable("reserva");
        modelBuilder.Entity<PagoServicio>().ToTable("pago_servicio");

        // ---- Clave primaria compuesta de configuracion_item ----
        modelBuilder.Entity<ConfiguracionItem>()
            .HasKey(ci => new { ci.ConfiguracionId, ci.TipoCanchaId });

        modelBuilder.Entity<ConfiguracionItem>()
            .HasOne(ci => ci.Configuracion)
            .WithMany(c => c.Items)
            .HasForeignKey(ci => ci.ConfiguracionId);

        modelBuilder.Entity<ConfiguracionItem>()
            .HasOne(ci => ci.TipoCancha)
            .WithMany()
            .HasForeignKey(ci => ci.TipoCanchaId);

        modelBuilder.Entity<ConfiguracionItem>()
            .HasOne(ci => ci.Complejo)
            .WithMany()
            .HasForeignKey(ci => ci.ComplejoId);

        // ---- usuario.email único (igual que "unique" en el SQL) ----
        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // ---- tipo_cancha: unique(complejo_id, nombre) ----
        modelBuilder.Entity<TipoCancha>()
            .HasIndex(t => new { t.ComplejoId, t.Nombre })
            .IsUnique();

        // ---- pago_servicio: unique(complejo_id, periodo) ----
        modelBuilder.Entity<PagoServicio>()
            .HasIndex(p => new { p.ComplejoId, p.Periodo })
            .IsUnique();

        // ---- reserva.creado_por -> usuario (FK opcional, sin navegación inversa) ----
        modelBuilder.Entity<Reserva>()
            .HasOne(r => r.CreadoPorUsuario)
            .WithMany()
            .HasForeignKey(r => r.CreadoPor)
            .OnDelete(DeleteBehavior.SetNull);
    }
}