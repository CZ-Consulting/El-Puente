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