using Backend.DTOs.Complejo;

namespace Backend.Services.Interfaces;

public interface IComplejoService
{
    Task<List<ComplejoListadoDto>> ListarAsync();
    Task<ComplejoDetalleDto?> ObtenerPorIdAsync(Guid id);
    Task<ComplejoDetalleDto> CrearAsync(ComplejoCrearDto dto);
    Task<bool> ActualizarAsync(Guid id, ComplejoActualizarDto dto);
}