using Backend.DTOs.TipoCancha;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/tipos-cancha")]
[Authorize]
public class TipoCanchaController : ControllerBase
{
    private readonly ITipoCanchaService _service;

    public TipoCanchaController(ITipoCanchaService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> Listar() => Ok(await _service.ListarAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(Guid id)
    {
        var resultado = await _service.ObtenerPorIdAsync(id);
        return resultado == null ? NotFound() : Ok(resultado);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Crear([FromBody] TipoCanchaCrearDto dto)
    {
        var creado = await _service.CrearAsync(dto);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = creado.Id }, creado);
    }

    // Edición completa: solo SuperAdmin (campos estructurales).
    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Actualizar(Guid id, [FromBody] TipoCanchaActualizarDto dto)
    {
        var ok = await _service.ActualizarAsync(id, dto);
        return ok ? NoContent() : NotFound();
    }

    // Edición acotada a precio: SuperAdmin o AdminComplejo (de su propio
    // complejo). Esta es la restricción de columna que RLS no puede
    // expresar por sí sola -> se resuelve acá, en el Service/Controller.
    [HttpPatch("{id}/precio")]
    [Authorize(Roles = "SuperAdmin,AdminComplejo")]
    public async Task<IActionResult> ActualizarPrecio(Guid id, [FromBody] TipoCanchaActualizarPrecioDto dto)
    {
        var ok = await _service.ActualizarPrecioAsync(id, dto);
        return ok ? NoContent() : NotFound();
    }
}