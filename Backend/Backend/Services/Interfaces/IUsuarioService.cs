using Backend.DTOs.Usuario;

namespace Backend.Services.Interfaces;

public interface IUsuarioService
{
    Task<List<UsuarioListadoDto>> ListarAsync();
    Task<UsuarioDetalleDto?> ObtenerPorIdAsync(Guid id);
    Task<UsuarioDetalleDto> CrearAsync(UsuarioCrearDto dto);
    Task<bool> ActualizarAsync(Guid id, UsuarioActualizarDto dto);
}