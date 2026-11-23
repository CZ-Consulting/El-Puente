using Backend.Data;
using Backend.DTOs.Configuracion;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Implementations;

public class ConfiguracionService : IConfiguracionService
{
    private readonly AppDbContext _db;

    public ConfiguracionService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<ConfiguracionListadoDto>> ListarPorTerrenoAsync(Guid terrenoId)
    {
        return await _db.Configuraciones
            .Where(c => c.TerrenoId == terrenoId)
            .OrderBy(c => c.Nombre)
            .Select(c => new ConfiguracionListadoDto
            {
                Id = c.Id,
                Nombre = c.Nombre,
                TerrenoId = c.TerrenoId
            })
            .ToListAsync();
    }

    public async Task<ConfiguracionDetalleDto?> ObtenerPorIdAsync(Guid id)
    {
        var config = await _db.Configuraciones
            .Include(c => c.Items)
                .ThenInclude(i => i.TipoCancha)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (config == null) return null;

        return new ConfiguracionDetalleDto
        {
            Id = config.Id,
            Nombre = config.Nombre,
            TerrenoId = config.TerrenoId,
            ComplejoId = config.ComplejoId,
            CreadoEn = config.CreadoEn,
            Items = config.Items.Select(i => new ConfiguracionItemDto
            {
                TipoCanchaId = i.TipoCanchaId,
                TipoCanchaNombre = i.TipoCancha?.Nombre ?? "",
                Cantidad = i.Cantidad
            }).ToList()
        };
    }

    public async Task<ConfiguracionDetalleDto> CrearAsync(ConfiguracionCrearDto dto)
    {
        if (dto.Items == null || dto.Items.Count == 0)
            throw new ArgumentException("Un caso necesita al menos un ítem (tipo de cancha + cantidad).");

        // complejo_id está denormalizado en configuracion y configuracion_item
        // (para simplificar RLS), así que lo resolvemos a partir del terreno.
        var terreno = await _db.Terrenos.FindAsync(dto.TerrenoId)
            ?? throw new KeyNotFoundException("El terreno indicado no existe.");

        var configuracion = new Models.Configuracion
        {
            Id = Guid.NewGuid(),
            ComplejoId = terreno.ComplejoId,
            TerrenoId = dto.TerrenoId,
            Nombre = dto.Nombre,
            CreadoEn = DateTimeOffset.UtcNow
        };

        _db.Configuraciones.Add(configuracion);

        foreach (var item in dto.Items)
        {
            _db.ConfiguracionItems.Add(new Models.ConfiguracionItem
            {
                ConfiguracionId = configuracion.Id,
                TipoCanchaId = item.TipoCanchaId,
                ComplejoId = terreno.ComplejoId,
                Cantidad = item.Cantidad
            });
        }

        await _db.SaveChangesAsync();

        return (await ObtenerPorIdAsync(configuracion.Id))!;
    }

    public async Task<bool> ActualizarAsync(Guid id, ConfiguracionActualizarDto dto)
    {
        if (dto.Items == null || dto.Items.Count == 0)
            throw new ArgumentException("Un caso necesita al menos un ítem (tipo de cancha + cantidad).");

        var configuracion = await _db.Configuraciones
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (configuracion == null) return false;

        configuracion.Nombre = dto.Nombre;

        // Reemplazo total de items: se borran los existentes y se insertan
        // los nuevos tal cual los mandó el frontend.
        _db.ConfiguracionItems.RemoveRange(configuracion.Items);

        foreach (var item in dto.Items)
        {
            _db.ConfiguracionItems.Add(new Models.ConfiguracionItem
            {
                ConfiguracionId = configuracion.Id,
                TipoCanchaId = item.TipoCanchaId,
                ComplejoId = configuracion.ComplejoId,
                Cantidad = item.Cantidad
            });
        }

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> EliminarAsync(Guid id)
    {
        var configuracion = await _db.Configuraciones
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (configuracion == null) return false;

        _db.ConfiguracionItems.RemoveRange(configuracion.Items);
        _db.Configuraciones.Remove(configuracion);
        await _db.SaveChangesAsync();
        return true;
    }
}