@echo off
setlocal enabledelayedexpansion

REM Récupérer la date et l'heure au format YYYY-MM-DD HH:MM:SS
for /f "tokens=1-5 delims=/:. " %%d in ("%date% %time%") do (
  set year=%%f
  set month=%%e
  set day=%%d
  set hour=%%g
  set minute=%%h
  set second=%%i
)
set timestamp=%year%-%month%-%day% %hour%:%minute%:%second%

echo 🚀 Synchronisation avec le dépôt distant...
git pull --rebase

if errorlevel 1 (
  echo ERREUR lors du pull. Résolvez les conflits avant de continuer.
  pause
  exit /b 1
)

echo 🚀 Ajout des fichiers...
git add .

echo 🚀 Commit...
git commit -m "Auto push du %timestamp%"

if errorlevel 1 (
  echo Pas de changement à commit.
) else (
  echo Commit effectué.
)

echo 🚀 Push vers GitHub...
git push origin main

if errorlevel 1 (
  echo ERREUR lors du push. Vérifiez votre connexion ou les conflits.
  pause
  exit /b 1
)

echo Push terminé avec succès.
pause
