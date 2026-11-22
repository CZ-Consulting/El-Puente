using Backend.Data;
using Backend.DTOs.Terreno;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Implementations;

public class TerrenoService : ITerrenoService
{
    private readonly AppDbContext _db;

    public TerrenoService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<TerrenoListadoDto>> ListarAsync()
    {
        return await _db.Terrenos
            .OrderBy(t => t.Nombre)
            .Select(t => new TerrenoListadoDto { Id = t.Id, Nombre = t.Nombre })
            .ToListAsync();
    }

    public async Task<TerrenoDetalleDto?> ObtenerPorIdAsync(Guid id)
    {
        return await _db.Terrenos
            .Where(t => t.Id == id)
            .Select(t => new TerrenoDetalleDto
            {
                Id = t.Id,
                Nombre = t.Nombre,
                ComplejoId = t.ComplejoId,
                CreadoEn = t.CreadoEn
            })
            .FirstOrDefaultAsync();
    }

    public async Task<TerrenoDetalleDto> CrearAsync(TerrenoCrearDto dto)
    {
        var terreno = new Models.Terreno
        {
            Id = Guid.NewGuid(),
            ComplejoId = dto.ComplejoId,
            Nombre = dto.Nombre,
            CreadoEn = DateTimeOffset.UtcNow
        };

        _db.Terrenos.Add(terreno);
        await _db.SaveChangesAsync();

        return new TerrenoDetalleDto
        {
            Id = terreno.Id,
            Nombre = terreno.Nombre,
            ComplejoId = terreno.ComplejoId,
            CreadoEn = terreno.CreadoEn
        };
    }

    public async Task<bool> ActualizarAsync(Guid id, TerrenoActualizarDto dto)
    {
        var terreno = await _db.Terrenos.FindAsync(id);
        if (terreno == null) return false;

        terreno.Nombre = dto.Nombre;
        await _db.SaveChangesAsync();
        return true;
    }
}