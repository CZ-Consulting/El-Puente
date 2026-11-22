using Backend.DTOs.TipoCancha;

namespace Backend.Services.Interfaces;

public interface ITipoCanchaService
{
    Task<List<TipoCanchaListadoDto>> ListarAsync();
    Task<TipoCanchaDetalleDto?> ObtenerPorIdAsync(Guid id);
    Task<TipoCanchaDetalleDto> CrearAsync(TipoCanchaCrearDto dto);
    Task<bool> ActualizarAsync(Guid id, TipoCanchaActualizarDto dto);
    Task<bool> ActualizarPrecioAsync(Guid id, TipoCanchaActualizarPrecioDto dto);
}