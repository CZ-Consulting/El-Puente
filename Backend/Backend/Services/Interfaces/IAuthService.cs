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

    // "Olvidé mi contraseña": si el email existe y está activo, genera un
    // token de un solo uso y le manda el link por mail. Si no existe, no
    // hace nada -- pero el Controller responde igual en ambos casos (nunca
    // confirmar si un email está registrado).
    Task SolicitarResetPasswordAsync(string email);

    // Valida el token (no usado, no vencido) y, si es válido, actualiza la
    // contraseña y lo marca usado. Devuelve false si el token no es válido.
    Task<bool> RestablecerPasswordAsync(string token, string passwordNueva);
}