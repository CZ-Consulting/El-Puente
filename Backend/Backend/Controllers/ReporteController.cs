using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

// Dashboard operativo de recaudación. Los presets (día/semana/mes/trimestre)
// los resuelve el FRONTEND calculando "desde"/"hasta" y llamando siempre a
// este mismo endpoint genérico con un rango de fechas explícito.
[ApiController]
[Route("api/reportes")]
[Authorize(Roles = "SuperAdmin,AdminComplejo")]
public class ReporteController : ControllerBase
{
    private readonly IReporteService _service;

    public ReporteController(IReporteService service)
    {
        _service = service;
    }

    [HttpGet("recaudacion")]
    public async Task<IActionResult> Recaudacion(
        [FromQuery] DateOnly desde,
        [FromQuery] DateOnly hasta,
        [FromQuery] Guid? complejoId)
    {
        var resultado = await _service.ObtenerRecaudacionAsync(desde, hasta, complejoId);
        return Ok(resultado);
    }

    // Dashboard de actividad/churn: monitoreo interno de uso del sistema
    // por complejo cliente, exclusivo SuperAdmin (no tiene sentido que lo
    // vea un AdminComplejo, es información nuestra como dueños del producto).
    [HttpGet("actividad-complejos")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> ActividadComplejos()
        => Ok(await _service.ObtenerActividadComplejosAsync());

    // Comparativa de recaudación de TODOS los complejos en el mismo rango
    // de fechas -> para definir mensualidades adaptadas a los ingresos
    // reales de cada uno. Exclusivo SuperAdmin.
    [HttpGet("recaudacion-por-complejo")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> RecaudacionPorComplejo(
        [FromQuery] DateOnly desde, [FromQuery] DateOnly hasta)
        => Ok(await _service.ObtenerRecaudacionPorComplejoAsync(desde, hasta));
}