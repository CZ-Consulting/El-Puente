using Backend.Data;
using Backend.DTOs.PagoServicio;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Implementations;

public class PagoServicioService : IPagoServicioService
{
    private readonly AppDbContext _db;

    public PagoServicioService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<PagoServicioListadoDto>> ListarAsync()
    {
        return await _db.PagosServicio
            .Include(p => p.Complejo)
            .OrderByDescending(p => p.Periodo)
            .Select(p => new PagoServicioListadoDto
            {
                Id = p.Id,
                ComplejoId = p.ComplejoId,
                ComplejoNombre = p.Complejo!.Nombre,
                Periodo = p.Periodo,
                Pagado = p.Pagado,
                Monto = p.Monto
            })
            .ToListAsync();
    }

    public async Task<PagoServicioListadoDto> CrearAsync(PagoServicioCrearDto dto)
    {
        var yaExiste = await _db.PagosServicio
            .AnyAsync(p => p.ComplejoId == dto.ComplejoId && p.Periodo == dto.Periodo);
        if (yaExiste)
            throw new InvalidOperationException("Ya existe un registro de pago para ese complejo y período.");

        var pago = new Models.PagoServicio
        {
            Id = Guid.NewGuid(),
            ComplejoId = dto.ComplejoId,
            Periodo = dto.Periodo,
            Pagado = false,
            Monto = dto.Monto
        };

        _db.PagosServicio.Add(pago);
        await _db.SaveChangesAsync();

        var complejo = await _db.Complejos.FindAsync(dto.ComplejoId);

        return new PagoServicioListadoDto
        {
            Id = pago.Id,
            ComplejoId = pago.ComplejoId,
            ComplejoNombre = complejo?.Nombre ?? "",
            Periodo = pago.Periodo,
            Pagado = pago.Pagado,
            Monto = pago.Monto
        };
    }

    public async Task<bool> MarcarPagadoAsync(Guid id, PagoServicioMarcarPagadoDto dto)
    {
        var pago = await _db.PagosServicio.FindAsync(id);
        if (pago == null) return false;

        pago.Pagado = true;
        pago.FechaPago = dto.FechaPago;
        if (dto.Monto.HasValue)
            pago.Monto = dto.Monto;

        await _db.SaveChangesAsync();
        return true;
    }
}