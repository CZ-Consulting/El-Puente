using Backend.DTOs.Usuario;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/usuarios")]
[Authorize] // cualquier rol autenticado puede listar/ver (acotado por RLS a su propio complejo)
public class UsuarioController : ControllerBase
{
    private readonly IUsuarioService _service;

    public UsuarioController(IUsuarioService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
        => Ok(await _service.ListarAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(Guid id)
    {
        var resultado = await _service.ObtenerPorIdAsync(id);
        return resultado == null ? NotFound() : Ok(resultado);
    }

    // Crear queda abierto a SuperAdmin y AdminComplejo; la regla fina de
    // "qué rol puede crear qué rol" vive en UsuarioService.CrearAsync.
    [HttpPost]
    [Authorize(Roles = "SuperAdmin,AdminComplejo")]
    public async Task<IActionResult> Crear([FromBody] UsuarioCrearDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { error = "Email y password son requeridos." });

        var creado = await _service.CrearAsync(dto);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = creado.Id }, creado);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin,AdminComplejo")]
    public async Task<IActionResult> Actualizar(Guid id, [FromBody] UsuarioActualizarDto dto)
    {
        var ok = await _service.ActualizarAsync(id, dto);
        return ok ? NoContent() : NotFound();
    }
}