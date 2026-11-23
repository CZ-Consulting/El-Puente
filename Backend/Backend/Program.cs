using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ---- Servicios base ----
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger con soporte para pegar el JWT en el botón "Authorize" (si no,
// no se puede probar ningún endpoint con [Authorize] desde Swagger UI).
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "Pegá acá el token tal cual, SIN la palabra 'Bearer' adelante.",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT"
    });
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ---- Base de datos (Supabase/Postgres vía Npgsql) ----
builder.Services.AddDbContext<Backend.Data.AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration["Supabase:ConnectionString"])
           .UseSnakeCaseNamingConvention());

// ---- CORS ----
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:Origins")
            .GetChildren().Select(c => c.Value).Where(v => v != null).ToArray();
        policy.WithOrigins(origins!).AllowAnyHeader().AllowAnyMethod();
    });
});

// ---- Autenticación JWT ----
builder.Services.AddAuthentication(Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Sin esto, ASP.NET Core remapea el claim "sub" del JWT a un nombre
        // legado (ClaimTypes.NameIdentifier), así que
        // User.FindFirst(JwtRegisteredClaimNames.Sub) nunca lo encuentra y
        // CurrentUserService.UsuarioId cae silenciosamente en Guid.Empty.
        // Eso rompe el FK de reserva.creado_por -> usuario(id).
        options.MapInboundClaims = false;

        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                System.Text.Encoding.UTF8.GetBytes(builder.Configuration["Jwt:SecretKey"]!))
        };
    });

builder.Services.AddHttpContextAccessor();

// ---- Servicios de negocio (Interfaz -> Implementación) ----
builder.Services.AddScoped<Backend.Services.Interfaces.ICurrentUserService, Backend.Services.Implementations.CurrentUserService>();
builder.Services.AddScoped<Backend.Services.Interfaces.IAuthService, Backend.Services.Implementations.AuthService>();
// "Olvidé mi contraseña" manda el link por mail vía SMTP -- ver
// appsettings "Smtp:*" y "Frontend:BaseUrl". Sin Smtp:Host configurado,
// SmtpEmailService solo loguea el link en la consola del backend (útil en
// desarrollo local) en vez de tirar error.
builder.Services.AddScoped<Backend.Services.Interfaces.IEmailService, Backend.Services.Implementations.SmtpEmailService>();
builder.Services.AddScoped<Backend.Services.Interfaces.IComplejoService, Backend.Services.Implementations.ComplejoService>();
builder.Services.AddScoped<Backend.Services.Interfaces.IUsuarioService, Backend.Services.Implementations.UsuarioService>();
builder.Services.AddScoped<Backend.Services.Interfaces.ITerrenoService, Backend.Services.Implementations.TerrenoService>();
builder.Services.AddScoped<Backend.Services.Interfaces.ITipoCanchaService, Backend.Services.Implementations.TipoCanchaService>();
builder.Services.AddScoped<Backend.Services.Interfaces.IConfiguracionService, Backend.Services.Implementations.ConfiguracionService>();
builder.Services.AddScoped<Backend.Services.Interfaces.IReservaService, Backend.Services.Implementations.ReservaService>();
builder.Services.AddScoped<Backend.Services.Interfaces.IPagoServicioService, Backend.Services.Implementations.PagoServicioService>();
builder.Services.AddScoped<Backend.Services.Interfaces.IReporteService, Backend.Services.Implementations.ReporteService>();

var app = builder.Build();

// ---- Pipeline (el orden acá importa) ----
app.UseMiddleware<Backend.Middleware.ErrorHandlingMiddleware>();

app.UseCors("FrontendPolicy");

app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<Backend.Middleware.TenantContextMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapControllers();

app.Run();