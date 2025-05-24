@echo off
REM ----------------------------------------
REM  Simple Auto-Push pour Windows
REM ----------------------------------------

echo 🚀 Ajout de tous les fichiers...
git add .

echo 🚀 Commit automatique...
git commit -m "Auto-push %date% %time%" || echo Rien à commit

echo 🚀 Push vers GitHub...
git push origin main

echo.
echo ► Push terminé.
pause
