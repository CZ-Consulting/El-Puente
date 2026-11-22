namespace Backend.Services.Interfaces;

public interface ICurrentUserService
{
    Guid UsuarioId { get; }
    string Rol { get; }
    Guid? ComplejoId { get; }
    bool EsSuperAdmin => Rol == "SuperAdmin";
}