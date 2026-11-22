using Backend.DTOs.Complejo;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

// Gestión de complejos: hoy en día es exclusivo del SuperAdmin (alta de
// clientes nuevos del producto). Coincide con la policy RLS de "complejo",
// que también restringe INSERT/UPDATE/DELETE a SuperAdmin.
[ApiController]
[Route("api/complejos")]
[Authorize(Roles = "SuperAdmin")]
public class ComplejoController : ControllerBase
{
    private readonly IComplejoService _service;

    public ComplejoController(IComplejoService service)
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

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] ComplejoCrearDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre))
            return BadRequest(new { error = "El nombre es requerido." });

        var creado = await _service.CrearAsync(dto);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = creado.Id }, creado);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Actualizar(Guid id, [FromBody] ComplejoActualizarDto dto)
    {
        var ok = await _service.ActualizarAsync(id, dto);
        return ok ? NoContent() : NotFound();
    }
}