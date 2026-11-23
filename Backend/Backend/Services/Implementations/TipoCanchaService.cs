using Backend.Data;
using Backend.DTOs.TipoCancha;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Implementations;

public class TipoCanchaService : ITipoCanchaService
{
    private readonly AppDbContext _db;

    public TipoCanchaService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<TipoCanchaListadoDto>> ListarAsync()
    {
        return await _db.TiposCancha
            .OrderBy(t => t.Nombre)
            .Select(t => new TipoCanchaListadoDto
            {
                Id = t.Id,
                Nombre = t.Nombre,
                JugadoresPorEquipo = t.JugadoresPorEquipo,
                PrecioPorHora = t.PrecioPorHora,
                Activo = t.Activo,
                ComplejoId = t.ComplejoId
            })
            .ToListAsync();
    }

    public async Task<TipoCanchaDetalleDto?> ObtenerPorIdAsync(Guid id)
    {
        return await _db.TiposCancha
            .Where(t => t.Id == id)
            .Select(t => new TipoCanchaDetalleDto
            {
                Id = t.Id,
                Nombre = t.Nombre,
                JugadoresPorEquipo = t.JugadoresPorEquipo,
                PrecioPorHora = t.PrecioPorHora,
                Activo = t.Activo,
                ComplejoId = t.ComplejoId,
                CreadoEn = t.CreadoEn
            })
            .FirstOrDefaultAsync();
    }

    public async Task<TipoCanchaDetalleDto> CrearAsync(TipoCanchaCrearDto dto)
    {
        var tipo = new Models.TipoCancha
        {
            Id = Guid.NewGuid(),
            ComplejoId = dto.ComplejoId,
            Nombre = dto.Nombre,
            JugadoresPorEquipo = dto.JugadoresPorEquipo,
            PrecioPorHora = dto.PrecioPorHora,
            Activo = true,
            CreadoEn = DateTimeOffset.UtcNow
        };

        _db.TiposCancha.Add(tipo);
        await _db.SaveChangesAsync();

        return new TipoCanchaDetalleDto
        {
            Id = tipo.Id,
            Nombre = tipo.Nombre,
            JugadoresPorEquipo = tipo.JugadoresPorEquipo,
            PrecioPorHora = tipo.PrecioPorHora,
            Activo = tipo.Activo,
            ComplejoId = tipo.ComplejoId,
            CreadoEn = tipo.CreadoEn
        };
    }

    public async Task<bool> ActualizarAsync(Guid id, TipoCanchaActualizarDto dto)
    {
        var tipo = await _db.TiposCancha.FindAsync(id);
        if (tipo == null) return false;

        tipo.Nombre = dto.Nombre;
        tipo.JugadoresPorEquipo = dto.JugadoresPorEquipo;
        tipo.PrecioPorHora = dto.PrecioPorHora;
        tipo.Activo = dto.Activo;

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ActualizarPrecioAsync(Guid id, TipoCanchaActualizarPrecioDto dto)
    {
        // Nota: si quien llama es AdminComplejo y el tipo_cancha pertenece a
        // OTRO complejo, la policy RLS de SELECT ya hace que FindAsync
        // devuelva null acá (ni siquiera puede "ver" la fila) -> 404,
        // sin necesidad de un chequeo manual de complejo_id en C#.
        var tipo = await _db.TiposCancha.FindAsync(id);
        if (tipo == null) return false;

        tipo.PrecioPorHora = dto.PrecioPorHora;
        await _db.SaveChangesAsync();
        return true;
    }
}