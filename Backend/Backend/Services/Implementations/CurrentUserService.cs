using Backend.Services.Interfaces;

namespace Backend.Services.Implementations;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private System.Security.Claims.ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public Guid UsuarioId
    {
        get
        {
            var sub = User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
            return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
        }
    }

    public string Rol => User?.FindFirst("rol")?.Value ?? "";

    public Guid? ComplejoId
    {
        get
        {
            var val = User?.FindFirst("complejo_id")?.Value;
            return Guid.TryParse(val, out var id) ? id : null;
        }
    }
}