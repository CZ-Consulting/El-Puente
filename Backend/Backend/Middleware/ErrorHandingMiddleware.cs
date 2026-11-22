// Middleware/ErrorHandlingMiddleware.cs
using System.Net;
using System.Text.Json;

namespace Backend.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, IWebHostEnvironment env, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _env = env;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        var statusCode = ex switch
        {
            KeyNotFoundException => HttpStatusCode.NotFound,
            UnauthorizedAccessException => HttpStatusCode.Unauthorized,
            ArgumentException => HttpStatusCode.BadRequest,
            InvalidOperationException => HttpStatusCode.BadRequest,
            _ => HttpStatusCode.InternalServerError
        };

        // Loggeamos siempre el error completo con contexto, pero sin exponerlo al cliente.
        _logger.LogError(ex, "Error no manejado en {Path}", context.Request.Path);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var body = new Dictionary<string, object?>
        {
            ["error"] = ex.Message,
            ["status"] = (int)statusCode
        };

        // CRÍTICO: detalle/inner/stack solo en Development, nunca en producción
        // (fuga de información interna del servidor).
        if (_env.IsDevelopment())
        {
            body["detalle"] = ex.ToString();
            body["inner"] = ex.InnerException?.Message;
        }

        await context.Response.WriteAsync(JsonSerializer.Serialize(body));
    }
}

// Extension method para registrarlo prolijo en Program.cs:
// app.UseMiddleware<Backend.Middleware.ErrorHandlingMiddleware>();