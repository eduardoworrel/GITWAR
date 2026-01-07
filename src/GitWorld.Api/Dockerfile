FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS base
WORKDIR /app
EXPOSE 5138

FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src
COPY ["src/GitWorld.Api/GitWorld.Api.csproj", "GitWorld.Api/"]
COPY ["src/GitWorld.Shared/GitWorld.Shared.csproj", "GitWorld.Shared/"]
RUN dotnet restore "GitWorld.Api/GitWorld.Api.csproj"
COPY src/ .
WORKDIR "/src/GitWorld.Api"
RUN dotnet build "GitWorld.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "GitWorld.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "GitWorld.Api.dll"]
