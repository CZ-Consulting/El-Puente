using Backend.Data;
using Backend.DTOs.Reporte;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Implementations;

public class ReporteService : IReporteService
{
    private readonly AppDbContext _db;

    public ReporteService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<RecaudacionDto> ObtenerRecaudacionAsync(DateOnly desde, DateOnly hasta, Guid? complejoId)
    {
        if (hasta < desde)
            throw new ArgumentException("La fecha 'hasta' no puede ser anterior a 'desde'.");

        // Solo reservas confirmadas cuentan como recaudación real
        // (una cancelada no se cobra). RLS ya acota por complejo salvo
        // SuperAdmin, que además puede filtrar a un complejo puntual acá.
        var query = _db.Reservas
            .Where(r => r.Estado == "confirmada" && r.Fecha >= desde && r.Fecha <= hasta);

        if (complejoId.HasValue)
            query = query.Where(r => r.ComplejoId == complejoId.Value);

        var porDia = await query
            .GroupBy(r => r.Fecha)
            .Select(g => new RecaudacionPorDiaDto
            {
                Fecha = g.Key,
                Total = g.Sum(r => r.PrecioTotal),
                CantidadReservas = g.Count()
            })
            .OrderBy(d => d.Fecha)
            .ToListAsync();

        return new RecaudacionDto
        {
            Desde = desde,
            Hasta = hasta,
            Total = porDia.Sum(d => d.Total),
            CantidadReservas = porDia.Sum(d => d.CantidadReservas),
            PorDia = porDia
        };
    }

    // Umbral de "sin actividad" para marcar riesgo de churn. 14 días es un
    // punto de partida razonable (dos semanas sin cargar ni una reserva y
    // sin que nadie del complejo entre al sistema); ajustable según lo que
    // observen en la práctica con los primeros clientes reales.
    private const int DiasUmbralRiesgo = 14;

    public async Task<List<ActividadComplejoDto>> ObtenerActividadComplejosAsync()
    {
        var hace30Dias = DateTimeOffset.UtcNow.AddDays(-30);

        var complejos = await _db.Complejos.ToListAsync();

        var usuariosActivosPorComplejo = await _db.Usuarios
            .Where(u => u.Activo && u.ComplejoId != null)
            .GroupBy(u => u.ComplejoId!.Value)
            .Select(g => new { ComplejoId = g.Key, Cantidad = g.Count() })
            .ToDictionaryAsync(x => x.ComplejoId, x => x.Cantidad);

        var ultimoLoginPorComplejo = await _db.Usuarios
            .Where(u => u.UltimoLogin != null && u.ComplejoId != null)
            .GroupBy(u => u.ComplejoId!.Value)
            .Select(g => new { ComplejoId = g.Key, Max = g.Max(u => u.UltimoLogin) })
            .ToDictionaryAsync(x => x.ComplejoId, x => x.Max);

        var reservasUltimos30PorComplejo = await _db.Reservas
            .Where(r => r.CreadoEn >= hace30Dias)
            .GroupBy(r => r.ComplejoId)
            .Select(g => new { ComplejoId = g.Key, Cantidad = g.Count() })
            .ToDictionaryAsync(x => x.ComplejoId, x => x.Cantidad);

        var ultimaReservaPorComplejo = await _db.Reservas
            .GroupBy(r => r.ComplejoId)
            .Select(g => new { ComplejoId = g.Key, Max = g.Max(r => r.CreadoEn) })
            .ToDictionaryAsync(x => x.ComplejoId, x => (DateTimeOffset?)x.Max);

        var ahora = DateTimeOffset.UtcNow;
        var resultado = new List<ActividadComplejoDto>();

        foreach (var complejo in complejos)
        {
            ultimaReservaPorComplejo.TryGetValue(complejo.Id, out var ultimaReserva);
            ultimoLoginPorComplejo.TryGetValue(complejo.Id, out var ultimoLogin);

            DateTimeOffset? ultimaActividad = null;
            if (ultimaReserva.HasValue && ultimoLogin.HasValue)
                ultimaActividad = ultimaReserva > ultimoLogin ? ultimaReserva : ultimoLogin;
            else
                ultimaActividad = ultimaReserva ?? ultimoLogin;

            int? diasSinActividad = ultimaActividad.HasValue
                ? (int)(ahora - ultimaActividad.Value).TotalDays
                : null;

            // Sin ninguna actividad nunca registrada -> también se marca en
            // riesgo si el complejo ya lleva más de el umbral creado (para
            // detectar clientes nuevos que nunca llegaron a usar el sistema).
            var diasDesdeCreacion = (int)(ahora - complejo.CreadoEn).TotalDays;
            var enRiesgo = diasSinActividad.HasValue
                ? diasSinActividad.Value > DiasUmbralRiesgo
                : diasDesdeCreacion > DiasUmbralRiesgo;

            resultado.Add(new ActividadComplejoDto
            {
                ComplejoId = complejo.Id,
                ComplejoNombre = complejo.Nombre,
                Activo = complejo.Activo,
                CantidadUsuariosActivos = usuariosActivosPorComplejo.GetValueOrDefault(complejo.Id),
                CantidadReservasUltimos30Dias = reservasUltimos30PorComplejo.GetValueOrDefault(complejo.Id),
                FechaUltimaReserva = ultimaReserva,
                FechaUltimoLogin = ultimoLogin,
                DiasSinActividad = diasSinActividad,
                EnRiesgoDeChurn = enRiesgo
            });
        }

        return resultado.OrderByDescending(r => r.EnRiesgoDeChurn).ThenBy(r => r.ComplejoNombre).ToList();
    }

    public async Task<List<RecaudacionComplejoDto>> ObtenerRecaudacionPorComplejoAsync(DateOnly desde, DateOnly hasta)
    {
        if (hasta < desde)
            throw new ArgumentException("La fecha 'hasta' no puede ser anterior a 'desde'.");

        // Trae TODOS los complejos (RLS ya le permite al SuperAdmin verlos
        // todos), incluso los que no tuvieron ninguna reserva en el período
        // -> esos van a aparecer con Total = 0, útil para detectar
        // justamente los complejos que no están facturando nada.
        var complejos = await _db.Complejos
            .OrderBy(c => c.Nombre)
            .Select(c => new { c.Id, c.Nombre })
            .ToListAsync();

        var recaudacionPorComplejo = await _db.Reservas
            .Where(r => r.Estado == "confirmada" && r.Fecha >= desde && r.Fecha <= hasta)
            .GroupBy(r => r.ComplejoId)
            .Select(g => new { ComplejoId = g.Key, Total = g.Sum(r => r.PrecioTotal), Cantidad = g.Count() })
            .ToDictionaryAsync(x => x.ComplejoId);

        return complejos
            .Select(c =>
            {
                recaudacionPorComplejo.TryGetValue(c.Id, out var datos);
                return new RecaudacionComplejoDto
                {
                    ComplejoId = c.Id,
                    ComplejoNombre = c.Nombre,
                    Total = datos?.Total ?? 0,
                    CantidadReservas = datos?.Cantidad ?? 0
                };
            })
            .OrderByDescending(r => r.Total)
            .ToList();
    }
}