using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Security.Cryptography;
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
    private readonly IEmailService _email;

    public AuthService(AppDbContext db, IConfiguration config, IEmailService email)
    {
        _db = db;
        _config = config;
        _email = email;
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

    // Vida del token: corta a propósito (una hora) porque viaja por email,
    // un canal que puede tardar en leerse, pero sigue siendo un acceso
    // directo a resetear la contraseña -- no conviene dejarlo vigente días.
    private static readonly TimeSpan DuracionTokenReset = TimeSpan.FromHours(1);

    public async Task SolicitarResetPasswordAsync(string email)
    {
        var (tokenPlano, tokenHash) = GenerarTokenReset();
        var expiraEn = DateTimeOffset.UtcNow.Add(DuracionTokenReset);

        // auth_generar_reset_token (ver sql/005_reset_password.sql) hace la
        // búsqueda por email + el insert del token en un solo paso atómico,
        // vía SECURITY DEFINER por la misma razón que login_buscar_usuario:
        // acá todavía no hay sesión autenticada. Devuelve una fila vacía
        // (sin Id/Nombre) si el email no existe o está inactivo.
        var fila = (await _db.Database
            .SqlQueryRaw<UsuarioResetRow>(
                "select * from auth_generar_reset_token({0}, {1}, {2})",
                email, tokenHash, expiraEn)
            .ToListAsync())
            .FirstOrDefault();

        // Email no encontrado (o inactivo): no mandamos nada, pero tampoco
        // tiramos error -- el Controller responde "éxito" en ambos casos
        // para no confirmar qué emails están registrados.
        if (fila == null || fila.UsuarioId == null) return;

        var frontendUrl = _config["Frontend:BaseUrl"]?.TrimEnd('/')
            ?? throw new InvalidOperationException("Falta configurar Frontend:BaseUrl.");
        var link = $"{frontendUrl}/restablecer-password?token={Uri.EscapeDataString(tokenPlano)}";

        var cuerpo = ArmarCuerpoResetPassword(fila.Nombre!, link);

        await _email.EnviarAsync(email, fila.Nombre!, "Restablecer tu contraseña", cuerpo);
    }

    public async Task<bool> RestablecerPasswordAsync(string token, string passwordNueva)
    {
        var tokenHash = HashearToken(token);
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(passwordNueva);

        // auth_restablecer_password no es idempotente (consume el token la
        // primera vez que corre), así que se llama UNA sola vez. Se usa
        // SqlQueryRaw en vez de ExecuteSqlRawAsync porque necesitamos leer el
        // boolean que devuelve la función, no solo un rowcount.
        var resultado = (await _db.Database
            .SqlQueryRaw<bool>("select auth_restablecer_password({0}, {1}) as \"Value\"", tokenHash, passwordHash)
            .ToListAsync())
            .FirstOrDefault();

        return resultado;
    }

    // Mismo esquema de colores del sistema (verde #0B6E4F / naranja #E8821F,
    // ver requerimientos-dominio.md "Estilo visual") para que el mail se vea
    // consistente con la app. HtmlEncode en el nombre porque viene de un
    // dato cargado por un usuario (no hay que confiar en que no tenga
    // caracteres que rompan el HTML).
    private static string ArmarCuerpoResetPassword(string nombreDestino, string link)
    {
        var nombreSeguro = WebUtility.HtmlEncode(nombreDestino);
        return $"""
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:0;background:#0B6E4F;border-radius:20px;overflow:hidden;">
              <div style="padding:28px 28px 20px 28px;">
                <div style="color:#F2EEE8;font-size:20px;font-weight:700;margin-bottom:18px;">El Puente</div>
                <div style="background:#0A3A2A;border-radius:16px;padding:24px;color:#F2EEE8;">
                  <p style="margin:0 0 14px 0;">Hola {nombreSeguro},</p>
                  <p style="margin:0 0 14px 0;line-height:1.6;">
                    Pediste restablecer tu contraseña. Si fuiste vos, tocá el botón de abajo para elegir una nueva
                    (el link vence en 1 hora):
                  </p>
                  <p style="margin:22px 0;text-align:center;">
                    <a href="{link}"
                       style="background:#E8821F;color:#ffffff;padding:13px 26px;border-radius:999px;text-decoration:none;display:inline-block;font-weight:700;">
                      Restablecer contraseña
                    </a>
                  </p>
                  <p style="font-size:12.5px;color:#BFD9CE;line-height:1.6;margin:0 0 10px 0;">
                    Si el botón no funciona, copiá y pegá este link en tu navegador:<br/>
                    <a href="{link}" style="color:#E8821F;">{link}</a>
                  </p>
                  <p style="font-size:12.5px;color:#BFD9CE;line-height:1.6;margin:0;">
                    Si no pediste esto, ignorá este mensaje: tu contraseña actual sigue siendo válida.
                  </p>
                </div>
              </div>
            </div>
            """;
    }

    private static (string tokenPlano, string tokenHash) GenerarTokenReset()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        var tokenPlano = Convert.ToHexString(bytes); // va en el link del mail
        return (tokenPlano, HashearToken(tokenPlano));
    }

    // SHA-256 del token: lo que se guarda en la base nunca es el valor que
    // viaja por el mail, así una filtración de la tabla no deja tokens
    // usables (ver comentario en sql/005_reset_password.sql).
    private static string HashearToken(string tokenPlano)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(tokenPlano)));

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

    // Idem, mapea el resultado de auth_generar_reset_token. UsuarioId/Nombre
    // quedan null si la función no encontró ningún email que matchee.
    private class UsuarioResetRow
    {
        public Guid? UsuarioId { get; set; }
        public string? Nombre { get; set; }
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