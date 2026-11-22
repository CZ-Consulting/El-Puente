using Backend.DTOs.PagoServicio;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

// Exclusivo de SuperAdmin: panel de control de la mensualidad que cada
// complejo le paga por el servicio (NO las señas de los clientes finales,
// eso es la tabla "reserva").
[ApiController]
[Route("api/pagos-servicio")]
[Authorize(Roles = "SuperAdmin")]
public class PagoServicioController : ControllerBase
{
    private readonly IPagoServicioService _service;

    public PagoServicioController(IPagoServicioService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> Listar() => Ok(await _service.ListarAsync());

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] PagoServicioCrearDto dto)
    {
        var creado = await _service.CrearAsync(dto);
        return Ok(creado);
    }

    [HttpPatch("{id}/pagar")]
    public async Task<IActionResult> MarcarPagado(Guid id, [FromBody] PagoServicioMarcarPagadoDto dto)
    {
        var ok = await _service.MarcarPagadoAsync(id, dto);
        return ok ? NoContent() : NotFound();
    }
}