@echo off
:: Menggunakan awalan minion-lang@ untuk memaksa perpindahan akun
set repo=https://minion-lang@github.com/minion-lang/smk-ai-learning.git

git config --global user.email "guru@smk-ai.com"
git config --global user.name "Guru SMK AI"

:: Reset folder git
rd /s /q .git

git init
git add .
git commit -m "Upload SMK AI - Switch Account"
git branch -M main
git remote add origin %repo%

echo.
echo ======================================================
echo SEDANG MENGHUBUNGKAN SEBAGAI: minion-lang
echo Jika muncul pop-up, pilih "Sign in with your browser"
echo dan pastikan login sebagai minion-lang.
echo ======================================================
git push -u origin main --force

pause
