FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build

WORKDIR /src
COPY src/GitWorld.Shared/*.csproj GitWorld.Shared/
COPY src/GitWorld.Api/*.csproj GitWorld.Api/
RUN dotnet restore GitWorld.Api/GitWorld.Api.csproj

COPY src/GitWorld.Shared/ GitWorld.Shared/
COPY src/GitWorld.Api/ GitWorld.Api/
RUN dotnet publish GitWorld.Api/GitWorld.Api.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview
WORKDIR /app
COPY --from=build /app .

ENV ASPNETCORE_URLS=http://+:5138
EXPOSE 5138

ENTRYPOINT ["dotnet", "GitWorld.Api.dll"]
