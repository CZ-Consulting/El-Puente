using Backend.DTOs.Reporte;

namespace Backend.Services.Interfaces;

public interface IReporteService
{
    // complejoId es opcional: lo usa el SuperAdmin para elegir qué complejo
    // mirar (ve el dashboard operativo de "cualquier" complejo, uno a la
    // vez). Para los demás roles, RLS ya acota a su propio complejo, así
    // que el parámetro no cambia nada si lo mandan en null.
    Task<RecaudacionDto> ObtenerRecaudacionAsync(DateOnly desde, DateOnly hasta, Guid? complejoId);

    // Dashboard de actividad/churn: exclusivo SuperAdmin.
    Task<List<ActividadComplejoDto>> ObtenerActividadComplejosAsync();

    // Comparativa de recaudación entre TODOS los complejos en un rango de
    // fechas: exclusivo SuperAdmin, para definir mensualidades adaptadas.
    Task<List<RecaudacionComplejoDto>> ObtenerRecaudacionPorComplejoAsync(DateOnly desde, DateOnly hasta);
}