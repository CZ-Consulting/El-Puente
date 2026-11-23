using System.Net;
using System.Net.Mail;
using Backend.Services.Interfaces;

namespace Backend.Services.Implementations;

// Implementación simple con System.Net.Mail: sirve para cualquier proveedor
// que exponga SMTP (Gmail con contraseña de aplicación, SendGrid, Mailgun,
// el SMTP del hosting, etc.) sin agregar un SDK/paquete extra.
//
// Config esperada (appsettings.json o variables de entorno
// Smtp__Host / Smtp__Puerto / etc. -- NUNCA hardcodeada):
//
//   "Smtp": {
//     "Host": "smtp.sendgrid.net",
//     "Puerto": 587,
//     "Usuario": "apikey",
//     "Password": "...",
//     "UsaSsl": true,
//     "DesdeEmail": "no-responder@lospinosfc.com",
//     "DesdeNombre": "Los Pinos FC"
//   }
public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task EnviarAsync(string destinatarioEmail, string destinatarioNombre, string asunto, string cuerpoHtml)
    {
        var host = _config["Smtp:Host"];
        if (string.IsNullOrWhiteSpace(host))
        {
            // Sin SMTP configurado (típico en un ambiente de desarrollo local
            // que todavía no tiene credenciales de mail), no tiramos una
            // excepción que rompa el flujo de "olvidé mi contraseña" -- solo
            // lo logueamos, para que el desarrollador vea el link en la
            // consola del backend y pueda probarlo igual sin mandar un mail
            // real.
            _logger.LogWarning(
                "Smtp:Host no está configurado. No se envió el email a {Email}. Asunto: {Asunto}\n{Cuerpo}",
                destinatarioEmail, asunto, cuerpoHtml);
            return;
        }

        var puerto = _config.GetValue<int?>("Smtp:Puerto") ?? 587;
        var usaSsl = _config.GetValue<bool?>("Smtp:UsaSsl") ?? true;
        var usuario = _config["Smtp:Usuario"];
        var password = _config["Smtp:Password"];
        var desdeEmail = _config["Smtp:DesdeEmail"] ?? usuario
            ?? throw new InvalidOperationException("Falta configurar Smtp:DesdeEmail.");
        var desdeNombre = _config["Smtp:DesdeNombre"] ?? "Gestión de Canchas";

        using var mensaje = new MailMessage
        {
            From = new MailAddress(desdeEmail, desdeNombre),
            Subject = asunto,
            Body = cuerpoHtml,
            IsBodyHtml = true
        };
        mensaje.To.Add(new MailAddress(destinatarioEmail, destinatarioNombre));

        using var cliente = new SmtpClient(host, puerto)
        {
            EnableSsl = usaSsl,
            Credentials = string.IsNullOrEmpty(usuario) ? null : new NetworkCredential(usuario, password)
        };

        await cliente.SendMailAsync(mensaje);
    }
}