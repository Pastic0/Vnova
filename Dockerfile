# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY Vnova.AspNetCore.sln ./
COPY src/Vnova.Models/Vnova.Models.csproj src/Vnova.Models/
COPY src/Vnova.Data/Vnova.Data.csproj src/Vnova.Data/
COPY src/Vnova.Business/Vnova.Business.csproj src/Vnova.Business/
COPY src/Vnova.Web/Vnova.Web.csproj src/Vnova.Web/

RUN dotnet restore Vnova.AspNetCore.sln

COPY . .
RUN dotnet publish src/Vnova.Web/Vnova.Web.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

ENV DOTNET_EnableDiagnostics=0
# Render and similar container platforms may have a low inotify limit.
# Production configuration files do not need hot reload.
ENV DOTNET_HOSTBUILDER__RELOADCONFIGONCHANGE=false
# Any remaining file-provider watchers use polling instead of inotify.
ENV DOTNET_USE_POLLING_FILE_WATCHER=1
EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["sh", "-c", "dotnet Vnova.Web.dll --urls http://0.0.0.0:${PORT:-8080}"]
