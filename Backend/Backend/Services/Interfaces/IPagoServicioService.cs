using Backend.DTOs.PagoServicio;

namespace Backend.Services.Interfaces;

public interface IPagoServicioService
{
    Task<List<PagoServicioListadoDto>> ListarAsync();
    Task<PagoServicioListadoDto> CrearAsync(PagoServicioCrearDto dto);
    Task<bool> MarcarPagadoAsync(Guid id, PagoServicioMarcarPagadoDto dto);
}