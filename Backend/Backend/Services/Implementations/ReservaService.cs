using System.Data;
using Backend.Data;
using Backend.DTOs.Reserva;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Backend.Services.Implementations;

public class ReservaService : IReservaService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public ReservaService(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<List<ReservaListadoDto>> ListarAsync(Guid terrenoId, DateOnly fecha)
    {
        return await _db.Reservas
            .Include(r => r.TipoCancha)
            .Where(r => r.TerrenoId == terrenoId && r.Fecha == fecha)
            .OrderBy(r => r.HoraInicio)
            .Select(r => new ReservaListadoDto
            {
                Id = r.Id,
                TerrenoId = r.TerrenoId,
                TipoCanchaId = r.TipoCanchaId,
                TipoCanchaNombre = r.TipoCancha!.Nombre,
                Fecha = r.Fecha,
                HoraInicio = r.HoraInicio,
                HoraFin = r.HoraFin,
                ClienteNombre = r.ClienteNombre,
                PrecioTotal = r.PrecioTotal,
                Estado = r.Estado
            })
            .ToListAsync();
    }

    public async Task<ReservaDetalleDto?> ObtenerPorIdAsync(Guid id)
    {
        return await _db.Reservas
            .Include(r => r.TipoCancha)
            .Where(r => r.Id == id)
            .Select(r => new ReservaDetalleDto
            {
                Id = r.Id,
                TerrenoId = r.TerrenoId,
                TipoCanchaId = r.TipoCanchaId,
                TipoCanchaNombre = r.TipoCancha!.Nombre,
                Fecha = r.Fecha,
                HoraInicio = r.HoraInicio,
                HoraFin = r.HoraFin,
                ClienteNombre = r.ClienteNombre,
                ClienteTelefono = r.ClienteTelefono,
                PrecioTotal = r.PrecioTotal,
                SenaPagada = r.SenaPagada,
                SenaMonto = r.SenaMonto,
                SenaMetodo = r.SenaMetodo,
                Estado = r.Estado,
                CreadoPor = r.CreadoPor,
                CreadoEn = r.CreadoEn
            })
            .FirstOrDefaultAsync();
    }

    public async Task<ReservaDetalleDto> CrearAsync(ReservaCrearDto dto)
    {
        if (dto.HoraFin <= dto.HoraInicio)
            throw new ArgumentException("La hora de fin debe ser posterior a la hora de inicio.");

        // ---- Concurrencia: dos recepcionistas pueden intentar reservar el ----
        // mismo horario casi al mismo tiempo. El check de disponibilidad y el
        // insert se ejecutan dentro de una transacción SERIALIZABLE: si Postgres
        // detecta que otra transacción concurrente tocó las mismas filas de
        // "reserva" para ese terreno/fecha/horario, UNA de las dos transacciones
        // aborta con el error 40001 (serialization_failure) y la reintentamos
        // automáticamente, recalculando la disponibilidad desde cero. Así nunca
        // pueden "pasar" dos reservas que juntas excedan la capacidad de ningún
        // caso válido, aunque los dos POST hayan llegado en el mismo milisegundo.
        const int intentosMaximos = 3;

        for (var intento = 1; intento <= intentosMaximos; intento++)
        {
            await using var transaccion = await _db.Database
                .BeginTransactionAsync(IsolationLevel.Serializable);

            try
            {
                var tipoCancha = await _db.TiposCancha.FindAsync(dto.TipoCanchaId)
                    ?? throw new KeyNotFoundException("El tipo de cancha indicado no existe.");

                // ---- Algoritmo de disponibilidad (acordado con el cliente) ----
                // 1. Reservas existentes que se superponen en el tiempo, agrupadas
                //    por tipo de cancha (el "acumulado" actual).
                var acumulado = await ObtenerAcumuladoAsync(dto.TerrenoId, dto.Fecha, dto.HoraInicio, dto.HoraFin);

                // 2. Sumamos la reserva candidata al acumulado.
                acumulado[dto.TipoCanchaId] = acumulado.GetValueOrDefault(dto.TipoCanchaId) + 1;

                // 3. ¿Existe al menos un "caso" (Configuracion) del terreno cuyas
                //    cantidades por tipo alcancen para cubrir el acumulado?
                var configuraciones = await ObtenerConfiguracionesConItemsAsync(dto.TerrenoId);

                var hayCasoValido = configuraciones.Any(c => ConfiguracionCubreAcumulado(c, acumulado));

                if (!hayCasoValido)
                    throw new InvalidOperationException(
                        "No hay disponibilidad para ese tipo de cancha en el horario solicitado.");

                // Precio SIEMPRE calculado en el backend, nunca confiar en un total
                // que mande el cliente.
                var horas = (decimal)(dto.HoraFin - dto.HoraInicio).TotalHours;
                var precioTotal = tipoCancha.PrecioPorHora * horas;

                var reserva = new Reserva
                {
                    Id = Guid.NewGuid(),
                    ComplejoId = tipoCancha.ComplejoId,
                    TerrenoId = dto.TerrenoId,
                    TipoCanchaId = dto.TipoCanchaId,
                    Fecha = dto.Fecha,
                    HoraInicio = dto.HoraInicio,
                    HoraFin = dto.HoraFin,
                    ClienteNombre = dto.ClienteNombre,
                    ClienteTelefono = dto.ClienteTelefono,
                    PrecioTotal = precioTotal,
                    SenaPagada = dto.SenaPagada,
                    SenaMonto = dto.SenaMonto,
                    SenaMetodo = dto.SenaMetodo,
                    Estado = "confirmada",
                    CreadoPor = _currentUser.UsuarioId,
                    CreadoEn = DateTimeOffset.UtcNow
                };

                _db.Reservas.Add(reserva);
                await _db.SaveChangesAsync();

                await transaccion.CommitAsync();

                return (await ObtenerPorIdAsync(reserva.Id))!;
            }
            catch (PostgresException ex) when (ex.SqlState == "40001")
            {
                // serialization_failure: otra reserva concurrente para el mismo
                // horario ganó la carrera. Si todavía tenemos intentos, probamos
                // de nuevo desde cero (recalculando disponibilidad real).
                await transaccion.RollbackAsync();

                if (intento == intentosMaximos)
                    throw new InvalidOperationException(
                        "Se generó un conflicto con otra reserva simultánea para ese horario. " +
                        "Por favor, volvé a intentar.");
            }
            catch
            {
                await transaccion.RollbackAsync();
                throw;
            }
        }

        // Inalcanzable: el for siempre retorna o lanza antes de salir del loop.
        throw new InvalidOperationException(
            "No se pudo confirmar la reserva por un conflicto de concurrencia. Por favor, volvé a intentar.");
    }

    public async Task<bool> CancelarAsync(Guid id)
    {
        var reserva = await _db.Reservas.FindAsync(id);
        if (reserva == null) return false;

        reserva.Estado = "cancelada";
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<DisponibilidadTipoDto>> ConsultarDisponibilidadAsync(
        Guid terrenoId, DateOnly fecha, TimeOnly horaInicio, TimeOnly horaFin)
    {
        var acumulado = await ObtenerAcumuladoAsync(terrenoId, fecha, horaInicio, horaFin);
        var configuraciones = await ObtenerConfiguracionesConItemsAsync(terrenoId);

        // Casos vigentes = los que todavía soportan lo YA reservado
        // (sin sumar ninguna reserva candidata todavía).
        var vigentes = configuraciones.Where(c => ConfiguracionCubreAcumulado(c, acumulado)).ToList();

        // "Lo que se le ofrece a un operador como disponible es la unión de
        // los tipos/cantidades restantes de los casos que siguen vigentes."
        var disponiblePorTipo = new Dictionary<Guid, (string nombre, int cantidad)>();

        foreach (var config in vigentes)
        {
            foreach (var item in config.Items)
            {
                var yaReservado = acumulado.GetValueOrDefault(item.TipoCanchaId);
                var restante = item.Cantidad - yaReservado;
                if (restante <= 0) continue;

                var nombre = item.TipoCancha?.Nombre ?? "";
                if (!disponiblePorTipo.TryGetValue(item.TipoCanchaId, out var actual) || restante > actual.cantidad)
                    disponiblePorTipo[item.TipoCanchaId] = (nombre, restante);
            }
        }

        return disponiblePorTipo
            .Select(kv => new DisponibilidadTipoDto
            {
                TipoCanchaId = kv.Key,
                TipoCanchaNombre = kv.Value.nombre,
                CantidadDisponible = kv.Value.cantidad
            })
            .OrderBy(d => d.TipoCanchaNombre)
            .ToList();
    }

    // ---- Helpers privados del algoritmo de disponibilidad ----

    private async Task<Dictionary<Guid, int>> ObtenerAcumuladoAsync(
        Guid terrenoId, DateOnly fecha, TimeOnly horaInicio, TimeOnly horaFin)
    {
        // Overlap clásico de intervalos: existente.Inicio < nuevo.Fin Y nuevo.Inicio < existente.Fin
        var solapadas = await _db.Reservas
            .Where(r => r.TerrenoId == terrenoId
                     && r.Fecha == fecha
                     && r.Estado == "confirmada"
                     && r.HoraInicio < horaFin
                     && horaInicio < r.HoraFin)
            .GroupBy(r => r.TipoCanchaId)
            .Select(g => new { TipoCanchaId = g.Key, Cantidad = g.Count() })
            .ToListAsync();

        return solapadas.ToDictionary(x => x.TipoCanchaId, x => x.Cantidad);
    }

    private async Task<List<Configuracion>> ObtenerConfiguracionesConItemsAsync(Guid terrenoId)
    {
        return await _db.Configuraciones
            .Include(c => c.Items)
                .ThenInclude(i => i.TipoCancha)
            .Where(c => c.TerrenoId == terrenoId)
            .ToListAsync();
    }

    private static bool ConfiguracionCubreAcumulado(Configuracion config, Dictionary<Guid, int> acumulado)
    {
        foreach (var (tipoCanchaId, cantidadReservada) in acumulado)
        {
            if (cantidadReservada <= 0) continue;

            var cantidadDisponibleEnCaso = config.Items
                .FirstOrDefault(i => i.TipoCanchaId == tipoCanchaId)?.Cantidad ?? 0;

            if (cantidadReservada > cantidadDisponibleEnCaso)
                return false;
        }
        return true;
    }
}