using Backend.DTOs.Terreno;

namespace Backend.Services.Interfaces;

public interface ITerrenoService
{
    Task<List<TerrenoListadoDto>> ListarAsync();
    Task<TerrenoDetalleDto?> ObtenerPorIdAsync(Guid id);
    Task<TerrenoDetalleDto> CrearAsync(TerrenoCrearDto dto);
    Task<bool> ActualizarAsync(Guid id, TerrenoActualizarDto dto);
}