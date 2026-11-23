namespace Backend.Services.Interfaces;

// Abstracción mínima para no atar AuthService a un proveedor de mail
// concreto. La implementación real (SmtpEmailService) lee la config SMTP de
// appsettings/variables de entorno -- nunca hardcodeada, mismo criterio que
// la cadena de conexión a la base.
public interface IEmailService
{
    Task EnviarAsync(string destinatarioEmail, string destinatarioNombre, string asunto, string cuerpoHtml);
}