using Backend.DTOs.Auth;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
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
}