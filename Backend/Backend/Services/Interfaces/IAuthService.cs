using Backend.DTOs.Auth;

namespace Backend.Services.Interfaces;

public interface IAuthService
{
    // Devuelve null si el email no existe, está inactivo, o la password no matchea.
    // El Controller decide qué código HTTP devolver ante null (401, no 404 —
    // nunca confirmar si un email existe o no, por seguridad).
    Task<LoginResponseDto?> LoginAsync(string email, string password);

    // Para GET /api/auth/me: recupera los datos del usuario logueado (el
    // frontend lo usa al refrescar la página, para no perder la sesión).
    Task<UsuarioLogueadoDto?> ObtenerUsuarioActualAsync(Guid usuarioId);

    // Devuelve false si passwordActual no coincide con la guardada.
    Task<bool> CambiarPasswordAsync(Guid usuarioId, string passwordActual, string passwordNueva);
}