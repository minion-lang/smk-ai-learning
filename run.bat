@echo off
title SMK AI Learning Assistant
echo.
echo  ========================================
echo   SMK AI Learning Assistant
echo   Teknik Instalasi Tenaga Listrik
echo  ========================================
echo.
echo  Membuka aplikasi di browser...

:: Pindah ke folder file ini berada
cd /d "%~dp0"

start "" "index.html"

echo.
echo  Aplikasi berhasil dibuka! Jendela ini akan tertutup otomatis.
timeout /t 3 /nobreak >nul
