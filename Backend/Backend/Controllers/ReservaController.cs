using Backend.DTOs.Reserva;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/reservas")]
[Authorize]
public class ReservaController : ControllerBase
{
    private readonly IReservaService _service;

    public ReservaController(IReservaService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] Guid terrenoId, [FromQuery] DateOnly fecha)
        => Ok(await _service.ListarAsync(terrenoId, fecha));

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(Guid id)
    {
        var resultado = await _service.ObtenerPorIdAsync(id);
        return resultado == null ? NotFound() : Ok(resultado);
    }

    // Visualizador operativo (lo usa también Preparador) y chequeo previo
    // a reservar desde el formulario de nueva reserva.
    [HttpGet("disponibilidad")]
    public async Task<IActionResult> ConsultarDisponibilidad(
        [FromQuery] Guid terrenoId, [FromQuery] DateOnly fecha,
        [FromQuery] TimeOnly horaInicio, [FromQuery] TimeOnly horaFin)
    {
        var resultado = await _service.ConsultarDisponibilidadAsync(terrenoId, fecha, horaInicio, horaFin);
        return Ok(resultado);
    }

    // Nunca Preparador (solo lectura/visualizador, según reglas del dominio).
    [HttpPost]
    [Authorize(Roles = "SuperAdmin,AdminComplejo,Recepcionista")]
    public async Task<IActionResult> Crear([FromBody] ReservaCrearDto dto)
    {
        var creada = await _service.CrearAsync(dto);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = creada.Id }, creada);
    }

    [HttpPatch("{id}/cancelar")]
    [Authorize(Roles = "SuperAdmin,AdminComplejo,Recepcionista")]
    public async Task<IActionResult> Cancelar(Guid id)
    {
        var ok = await _service.CancelarAsync(id);
        return ok ? NoContent() : NotFound();
    }
}