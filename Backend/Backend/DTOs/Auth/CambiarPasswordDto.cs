namespace Backend.DTOs.Auth;

public class CambiarPasswordDto
{
    public string PasswordActual { get; set; } = string.Empty;
    public string PasswordNueva { get; set; } = string.Empty;
}