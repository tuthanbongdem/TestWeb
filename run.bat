@echo off
title Vocabulary
chcp 65001 >nul
echo.
echo  ╔═══════════════════════════════════════╗
echo  ║        Vocabulary  ^|  Blazor WASM     ║
echo  ╚═══════════════════════════════════════╝
echo.
echo  [*] Dang kiem tra .NET SDK...

where dotnet >nul 2>&1
if errorlevel 1 (
    echo  [!] Khong tim thay .NET SDK.
    echo      Tai ve tai: https://dot.net/download
    pause
    exit /b 1
)

echo  [*] .NET SDK hop le.
echo  [*] Khoi dong ung dung tai http://localhost:5000
echo  [*] Nhan Ctrl+C de dung.
echo.

REM Mo trinh duyet sau 5 giay (cho may chu san sang)
start /b cmd /c "timeout /t 5 >nul && start http://localhost:5000"

cd /d "%~dp0Vocabulary"
dotnet run --urls "http://localhost:5000"

echo.
echo  [*] Ung dung da dung.
pause
