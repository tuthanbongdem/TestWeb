# ── Build stage ──────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish VocabVault2/VocabVault2.csproj -c Release -o /release

# ── Serve stage ───────────────────────────────────────────────
FROM nginx:alpine
COPY --from=build /release/wwwroot /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
