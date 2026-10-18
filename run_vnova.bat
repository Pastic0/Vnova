@echo off
title Vnova

cd /d "%~dp0src"

echo ================================
echo Restore Vnova packages
echo ================================
dotnet restore ".\Vnova.Web\Vnova.Web.csproj"

if errorlevel 1 (
    echo.
    echo Restore bi loi. Kiem tra loi o tren.
    pause
    exit /b %errorlevel%
)

echo.
echo ================================
echo Start Vnova
echo ================================
dotnet run --project ".\Vnova.Web\Vnova.Web.csproj"

echo.
echo Vnova da dung hoac bi loi.
pause
