# ── Build stage ──────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
<<<<<<< HEAD
RUN dotnet publish Vocabulary/Vocabulary.csproj -c Release -o /release
=======
RUN dotnet publish VocabVault2/VocabVault2.csproj -c Release -o /release
>>>>>>> 966a175242513e4c4341502215c5f5ec6e789424

# ── Serve stage ───────────────────────────────────────────────
FROM nginx:alpine
COPY --from=build /release/wwwroot /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
