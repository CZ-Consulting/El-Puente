using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Backend.Data;
using Backend.DTOs.Auth;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<LoginResponseDto?> LoginAsync(string email, string password)
    {
        // Usamos la función SECURITY DEFINER login_buscar_usuario (ver
        // sql/002_funcion_login.sql) en vez de _db.Usuarios directo, porque
        // en este momento todavía no hay SET LOCAL app.current_rol aplicado
        // (nadie está autenticado todavía) y la policy RLS normal de
        // "usuario" bloquearía la búsqueda por email entre complejos.
        var fila = (await _db.Database
            .SqlQueryRaw<UsuarioLoginRow>(
                "select * from login_buscar_usuario({0})", email)
            .ToListAsync())
            .FirstOrDefault();

        if (fila == null || !fila.Activo)
            return null;

        if (!BCrypt.Net.BCrypt.Verify(password, fila.PasswordHash))
            return null;

        // Registramos el login (alimenta el dashboard de actividad/churn
        // del SuperAdmin). Usa su propia función SECURITY DEFINER por la
        // misma razón que login_buscar_usuario: la policy de UPDATE en
        // "usuario" es solo-SuperAdmin, y acá nadie está autenticado todavía.
        await _db.Database.ExecuteSqlRawAsync(
            "select login_actualizar_ultimo_login({0})", fila.Id);

        var (token, expira) = GenerarToken(fila.Id, fila.Rol, fila.ComplejoId);

        return new LoginResponseDto
        {
            Token = token,
            ExpiraEn = expira,
            Usuario = new UsuarioLogueadoDto
            {
                Id = fila.Id,
                Nombre = fila.Nombre,
                Email = email,
                Rol = fila.Rol,
                ComplejoId = fila.ComplejoId
            }
        };
    }

    public async Task<UsuarioLogueadoDto?> ObtenerUsuarioActualAsync(Guid usuarioId)
    {
        // Acá SÍ corre después de TenantContextMiddleware (ya hay sesión
        // autenticada), así que una consulta normal respeta RLS sin
        // problema: un usuario viendo su PROPIA fila siempre cae dentro
        // de "su propio complejo".
        return await _db.Usuarios
            .Where(u => u.Id == usuarioId)
            .Select(u => new UsuarioLogueadoDto
            {
                Id = u.Id,
                Nombre = u.Nombre,
                Email = u.Email,
                Rol = u.Rol,
                ComplejoId = u.ComplejoId
            })
            .FirstOrDefaultAsync();
    }

    public async Task<bool> CambiarPasswordAsync(Guid usuarioId, string passwordActual, string passwordNueva)
    {
        var usuario = await _db.Usuarios.FindAsync(usuarioId);
        if (usuario == null) return false;

        if (!BCrypt.Net.BCrypt.Verify(passwordActual, usuario.PasswordHash))
            return false;

        var nuevoHash = BCrypt.Net.BCrypt.HashPassword(passwordNueva);

        // La policy de UPDATE en "usuario" es solo-SuperAdmin, así que un
        // usuario cambiando SU PROPIA password necesita la misma salida
        // que login_buscar_usuario: una función SECURITY DEFINER acotada
        // (ver sql/004_cambiar_password.sql), nunca un UPDATE directo acá.
        await _db.Database.ExecuteSqlRawAsync(
            "select usuario_actualizar_password({0}, {1})", usuarioId, nuevoHash);

        return true;
    }

    // DTO interno, no es una entidad de EF: solo mapea el resultado de
    // la función SQL login_buscar_usuario. No necesita [Key] ni DbSet.
    private class UsuarioLoginRow
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;
        public Guid? ComplejoId { get; set; }
        public bool Activo { get; set; }
    }

    private (string token, DateTimeOffset expira) GenerarToken(Guid usuarioId, string rol, Guid? complejoId)
    {
        var secretKey = _config["Jwt:SecretKey"]
            ?? throw new InvalidOperationException("Falta configurar Jwt:SecretKey");
        var issuer = _config["Jwt:Issuer"];
        var audience = _config["Jwt:Audience"];

        var expira = DateTimeOffset.UtcNow.AddHours(24);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuarioId.ToString()),
            new("rol", rol),
            // Claim adicional de tipo ESTÁNDAR (ClaimTypes.Role), que es el que
            // lee el mecanismo built-in de [Authorize(Roles = "...")] de ASP.NET.
            // Sin esto, [Authorize(Roles=...)] siempre da 403 aunque el token
            // sea válido, porque busca este claim type específico, no "rol".
            new(ClaimTypes.Role, rol),
            // complejo_id vacío ("") para SuperAdmin -> el interceptor de RLS
            // ya sabe interpretar "" como "sin filtro, sos SuperAdmin".
            new("complejo_id", complejoId?.ToString() ?? "")
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expira.UtcDateTime,
            signingCredentials: creds
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expira);
    }
}