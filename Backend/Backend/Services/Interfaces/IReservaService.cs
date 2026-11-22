using Backend.DTOs.Reserva;

namespace Backend.Services.Interfaces;

public interface IReservaService
{
    Task<List<ReservaListadoDto>> ListarAsync(Guid terrenoId, DateOnly fecha);
    Task<ReservaDetalleDto?> ObtenerPorIdAsync(Guid id);
    Task<ReservaDetalleDto> CrearAsync(ReservaCrearDto dto);
    Task<bool> CancelarAsync(Guid id);

    // Visualizador operativo / chequeo previo a reservar.
    Task<List<DisponibilidadTipoDto>> ConsultarDisponibilidadAsync(
        Guid terrenoId, DateOnly fecha, TimeOnly horaInicio, TimeOnly horaFin);
}