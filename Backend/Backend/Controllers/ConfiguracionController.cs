using Backend.DTOs.Configuracion;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/configuraciones")]
[Authorize]
public class ConfiguracionController : ControllerBase
{
    private readonly IConfiguracionService _service;

    public ConfiguracionController(IConfiguracionService service)
    {
        _service = service;
    }

    // ?terrenoId=... -> lista los "casos" definidos para ese terreno
    [HttpGet]
    public async Task<IActionResult> ListarPorTerreno([FromQuery] Guid terrenoId)
        => Ok(await _service.ListarPorTerrenoAsync(terrenoId));

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(Guid id)
    {
        var resultado = await _service.ObtenerPorIdAsync(id);
        return resultado == null ? NotFound() : Ok(resultado);
    }

    // Escritura: solo SuperAdmin (coincide con la policy RLS).
    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Crear([FromBody] ConfiguracionCrearDto dto)
    {
        var creado = await _service.CrearAsync(dto);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = creado.Id }, creado);
    }
}