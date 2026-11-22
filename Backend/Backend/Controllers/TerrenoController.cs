using Backend.DTOs.Terreno;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/terrenos")]
[Authorize]
public class TerrenoController : ControllerBase
{
    private readonly ITerrenoService _service;

    public TerrenoController(ITerrenoService service)
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

    // Escritura: solo SuperAdmin (coincide con la policy RLS de terreno).
    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Crear([FromBody] TerrenoCrearDto dto)
    {
        var creado = await _service.CrearAsync(dto);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = creado.Id }, creado);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Actualizar(Guid id, [FromBody] TerrenoActualizarDto dto)
    {
        var ok = await _service.ActualizarAsync(id, dto);
        return ok ? NoContent() : NotFound();
    }
}