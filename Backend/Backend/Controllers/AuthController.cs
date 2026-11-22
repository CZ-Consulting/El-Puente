using Backend.DTOs.Auth;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ICurrentUserService _currentUser;

    public AuthController(IAuthService authService, ICurrentUserService currentUser)
    {
        _authService = authService;
        _currentUser = currentUser;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { error = "Email y password son requeridos." });

        var resultado = await _authService.LoginAsync(dto.Email, dto.Password);

        if (resultado == null)
            // Siempre el mismo mensaje genérico, nunca distinguir
            // "no existe el email" de "password incorrecta".
            return Unauthorized(new { error = "Email o contraseña incorrectos." });

        return Ok(resultado);
    }

    // El frontend lo llama al cargar la app (si hay un token guardado en
    // localStorage) para recuperar los datos del usuario sin obligarlo a
    // loguearse de nuevo cada vez que refresca la página.
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var usuario = await _authService.ObtenerUsuarioActualAsync(_currentUser.UsuarioId);
        return usuario == null ? NotFound() : Ok(usuario);
    }

    [HttpPatch("cambiar-password")]
    [Authorize]
    public async Task<IActionResult> CambiarPassword([FromBody] CambiarPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.PasswordNueva) || dto.PasswordNueva.Length < 6)
            return BadRequest(new { error = "La nueva contraseña debe tener al menos 6 caracteres." });

        var ok = await _authService.CambiarPasswordAsync(
            _currentUser.UsuarioId, dto.PasswordActual, dto.PasswordNueva);

        if (!ok)
            return BadRequest(new { error = "La contraseña actual no es correcta." });

        return NoContent();
    }
}