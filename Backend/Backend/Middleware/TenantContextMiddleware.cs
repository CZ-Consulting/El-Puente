// Middleware/TenantContextMiddleware.cs
//
// Después de que ASP.NET valida el JWT (UseAuthentication), este middleware
// toma los claims "rol" y "complejo_id" del token y los copia a variables de
// sesión de Postgres (app.current_rol / app.current_complejo_id), que son
// las que leen las políticas RLS vía current_setting(...).
//
// DETALLE IMPORTANTE (por qué se usa set_config(..., false) y no "true"):
// Postgres solo respeta "SET LOCAL" (is_local = true) dentro de una
// transacción explícita. Una Query de solo lectura normal de EF Core no abre
// una transacción propia, así que SET LOCAL se perdería sin efecto. En vez
// de forzar una transacción en cada request, mantenemos la MISMA conexión
// física abierta durante todo el request (ver OpenConnectionAsync más abajo)
// y usamos set_config con is_local=false, que persiste a nivel de sesión de
// esa conexión. Como ninguna otra request va a usar esa misma conexión física
// mientras esta la tiene abierta (el pool no la devuelve hasta que el
// DbContext se dispone al final del request), no hay forma de que el valor
// de un usuario se filtre a otro. Y como este middleware corre siempre
// ANTES de cualquier query del controller, cualquier conexión reciclada del
// pool queda sobre-escrita con el valor correcto antes de usarse.

using Backend.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Backend.Middleware;

public class TenantContextMiddleware
{
    private readonly RequestDelegate _next;

    public TenantContextMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var rol = context.User.FindFirst("rol")?.Value ?? "";
            var complejoId = context.User.FindFirst("complejo_id")?.Value ?? "";

            var connection = (NpgsqlConnection)db.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open)
                await connection.OpenAsync();

            // Npgsql no permite dos sentencias en un mismo comando cuando
            // lleva parámetros ("cannot insert multiple commands into a
            // prepared statement") -> van en dos comandos separados.
            await using (var cmd1 = connection.CreateCommand())
            {
                cmd1.CommandText = "SELECT set_config('app.current_complejo_id', $1, false);";
                cmd1.Parameters.Add(new NpgsqlParameter { Value = complejoId });
                await cmd1.ExecuteNonQueryAsync();
            }

            await using (var cmd2 = connection.CreateCommand())
            {
                cmd2.CommandText = "SELECT set_config('app.current_rol', $1, false);";
                cmd2.Parameters.Add(new NpgsqlParameter { Value = rol });
                await cmd2.ExecuteNonQueryAsync();
            }
        }

        await _next(context);
    }
}