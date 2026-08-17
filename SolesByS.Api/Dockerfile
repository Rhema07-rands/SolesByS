# Use the official .NET SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["SolesByS.Api.csproj", "./"]
RUN dotnet restore "SolesByS.Api.csproj"

# Copy the rest of the code and build
COPY . .
RUN dotnet publish "SolesByS.Api.csproj" -c Release -o /app/publish

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .

# Expose port 8080 (Render uses this by default)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_USE_POLLING_FILE_WATCHER=1
ENV DOTNET_HOSTBUILDER__RELOADCONFIGONCHANGE=false

ENTRYPOINT ["dotnet", "SolesByS.Api.dll"]
