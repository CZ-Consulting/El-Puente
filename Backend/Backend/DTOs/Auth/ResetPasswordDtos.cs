namespace Backend.DTOs.Auth;

public class OlvidePasswordDto
{
    public string Email { get; set; } = string.Empty;
}

public class RestablecerPasswordDto
{
    public string Token { get; set; } = string.Empty;
    public string PasswordNueva { get; set; } = string.Empty;
}