using Backend.DTOs.Configuracion;

namespace Backend.Services.Interfaces;

public interface IConfiguracionService
{
    Task<List<ConfiguracionListadoDto>> ListarPorTerrenoAsync(Guid terrenoId);
    Task<ConfiguracionDetalleDto?> ObtenerPorIdAsync(Guid id);
    Task<ConfiguracionDetalleDto> CrearAsync(ConfiguracionCrearDto dto);
    Task<bool> ActualizarAsync(Guid id, ConfiguracionActualizarDto dto);
    Task<bool> EliminarAsync(Guid id);
}