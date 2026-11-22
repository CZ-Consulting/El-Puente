using Backend.Data;
using Backend.DTOs.Complejo;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Implementations;

public class ComplejoService : IComplejoService
{
    private readonly AppDbContext _db;

    public ComplejoService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<ComplejoListadoDto>> ListarAsync()
    {
        // La policy RLS de "complejo" ya filtra: un SuperAdmin ve todos,
        // cualquier otro rol solo vería el suyo (si algún día se habilita
        // este endpoint para más roles). No hace falta repetir el filtro acá.
        return await _db.Complejos
            .OrderBy(c => c.Nombre)
            .Select(c => new ComplejoListadoDto
            {
                Id = c.Id,
                Nombre = c.Nombre,
                Activo = c.Activo
            })
            .ToListAsync();
    }

    public async Task<ComplejoDetalleDto?> ObtenerPorIdAsync(Guid id)
    {
        return await _db.Complejos
            .Where(c => c.Id == id)
            .Select(c => new ComplejoDetalleDto
            {
                Id = c.Id,
                Nombre = c.Nombre,
                Direccion = c.Direccion,
                Telefono = c.Telefono,
                Activo = c.Activo,
                CreadoEn = c.CreadoEn
            })
            .FirstOrDefaultAsync();
    }

    public async Task<ComplejoDetalleDto> CrearAsync(ComplejoCrearDto dto)
    {
        var complejo = new Models.Complejo
        {
            Id = Guid.NewGuid(),
            Nombre = dto.Nombre,
            Direccion = dto.Direccion,
            Telefono = dto.Telefono,
            Activo = true,
            CreadoEn = DateTimeOffset.UtcNow
        };

        _db.Complejos.Add(complejo);
        await _db.SaveChangesAsync();

        return new ComplejoDetalleDto
        {
            Id = complejo.Id,
            Nombre = complejo.Nombre,
            Direccion = complejo.Direccion,
            Telefono = complejo.Telefono,
            Activo = complejo.Activo,
            CreadoEn = complejo.CreadoEn
        };
    }

    public async Task<bool> ActualizarAsync(Guid id, ComplejoActualizarDto dto)
    {
        var complejo = await _db.Complejos.FindAsync(id);
        if (complejo == null) return false;

        complejo.Nombre = dto.Nombre;
        complejo.Direccion = dto.Direccion;
        complejo.Telefono = dto.Telefono;
        complejo.Activo = dto.Activo;

        await _db.SaveChangesAsync();
        return true;
    }
}