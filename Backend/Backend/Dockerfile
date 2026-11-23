# Backend/Backend/Dockerfile
#
# Build de 2 etapas: la primera (SDK completo) compila y publica; la
# segunda (runtime, mucho más liviana) es la que realmente corre en Render.
# Ubicar este archivo en Backend/Backend/ (al lado de Backend.csproj) y
# configurar en Render:
#   Root Directory:   Backend/Backend
#   Dockerfile Path:   Dockerfile          (relativo al Root Directory)
#
# Si tu .csproj no se llama "Backend.csproj", cambiá el nombre en las dos
# líneas que lo mencionan más abajo.

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore "Backend.csproj"
RUN dotnet publish "Backend.csproj" -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Render asigna el puerto a usar dinámicamente vía la variable de entorno
# $PORT (no es fijo). Kestrel tiene que escuchar justo ahí -- por eso el
# ENTRYPOINT es un shell que arma la URL recién al arrancar el contenedor
# (en runtime), nunca al construir la imagen (un "ENV ...=$PORT" plano acá
# no serviría: en build time esa variable todavía no existe).
ENTRYPOINT ["/bin/sh", "-c", "ASPNETCORE_URLS=http://+:${PORT:-10000} dotnet Backend.dll"]
