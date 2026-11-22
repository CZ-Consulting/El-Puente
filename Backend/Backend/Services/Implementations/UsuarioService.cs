using Backend.Data;
using Backend.DTOs.Usuario;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Implementations;

public class UsuarioService : IUsuarioService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    private static readonly string[] RolesValidos =
        { "SuperAdmin", "AdminComplejo", "Recepcionista", "Preparador" };

    public UsuarioService(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<List<UsuarioListadoDto>> ListarAsync()
    {
        // RLS ya filtra: AdminComplejo/Recepcionista/Preparador solo ven su
        // propio complejo; SuperAdmin ve todos. No duplicamos el filtro acá.
        return await _db.Usuarios
            .OrderBy(u => u.Nombre)
            .Select(u => new UsuarioListadoDto
            {
                Id = u.Id,
                Nombre = u.Nombre,
                Email = u.Email,
                Rol = u.Rol,
                Activo = u.Activo
            })
            .ToListAsync();
    }

    public async Task<UsuarioDetalleDto?> ObtenerPorIdAsync(Guid id)
    {
        return await _db.Usuarios
            .Where(u => u.Id == id)
            .Select(u => new UsuarioDetalleDto
            {
                Id = u.Id,
                Nombre = u.Nombre,
                Email = u.Email,
                Rol = u.Rol,
                ComplejoId = u.ComplejoId,
                Activo = u.Activo,
                CreadoEn = u.CreadoEn
            })
            .FirstOrDefaultAsync();
    }

    public async Task<UsuarioDetalleDto> CrearAsync(UsuarioCrearDto dto)
    {
        if (!RolesValidos.Contains(dto.Rol))
            throw new ArgumentException($"Rol inválido: {dto.Rol}");

        Guid? complejoIdFinal;

        // Reglas de quién puede crear a quién (defensa en profundidad además
        // de RLS/policies de escritura):
        if (_currentUser.EsSuperAdmin)
        {
            // SuperAdmin puede crear cualquier rol. Si crea un SuperAdmin,
            // complejo_id debe ser null; para el resto, el complejo que
            // haya indicado en el DTO.
            complejoIdFinal = dto.Rol == "SuperAdmin" ? null : dto.ComplejoId;

            if (dto.Rol != "SuperAdmin" && complejoIdFinal == null)
                throw new ArgumentException("ComplejoId es requerido para este rol.");
        }
        else if (_currentUser.Rol == "AdminComplejo")
        {
            // AdminComplejo SOLO puede crear Recepcionista/Preparador, y
            // SIEMPRE en su propio complejo (ignoramos cualquier otro valor
            // que venga en el DTO para evitar que cree usuarios en otro
            // complejo ajeno).
            if (dto.Rol != "Recepcionista" && dto.Rol != "Preparador")
                throw new UnauthorizedAccessException(
                    "Un Admin de Complejo solo puede crear usuarios Recepcionista o Preparador.");

            complejoIdFinal = _currentUser.ComplejoId;
        }
        else
        {
            throw new UnauthorizedAccessException(
                "No tenés permisos para crear usuarios.");
        }

        // Chequeo amigable de email duplicado antes del INSERT (la unicidad
        // real la garantiza el unique index de la tabla; esto solo mejora
        // el mensaje de error en el caso común).
        var yaExiste = await _db.Usuarios.AnyAsync(u => u.Email == dto.Email);
        if (yaExiste)
            throw new InvalidOperationException("Ya existe un usuario con ese email.");

        var usuario = new Models.Usuario
        {
            Id = Guid.NewGuid(),
            ComplejoId = complejoIdFinal,
            Nombre = dto.Nombre,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Rol = dto.Rol,
            Activo = true,
            CreadoEn = DateTimeOffset.UtcNow
        };

        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync();

        return new UsuarioDetalleDto
        {
            Id = usuario.Id,
            Nombre = usuario.Nombre,
            Email = usuario.Email,
            Rol = usuario.Rol,
            ComplejoId = usuario.ComplejoId,
            Activo = usuario.Activo,
            CreadoEn = usuario.CreadoEn
        };
    }

    public async Task<bool> ActualizarAsync(Guid id, UsuarioActualizarDto dto)
    {
        var usuario = await _db.Usuarios.FindAsync(id);
        if (usuario == null) return false;

        usuario.Nombre = dto.Nombre;
        usuario.Activo = dto.Activo;

        await _db.SaveChangesAsync();
        return true;
    }
}