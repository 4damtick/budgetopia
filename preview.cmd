@echo off
setlocal
cd /d "%~dp0"

if not exist "dist\index.html" (
  echo Missing dist\index.html.
  echo Copy the built dist folder into this repo first.
  pause
  exit /b 1
)

if not exist "node_modules\vite\bin\vite.js" (
  echo Missing node_modules\vite\bin\vite.js.
  echo Copy node_modules into this repo first.
  pause
  exit /b 1
)

echo Starting Budgetopia preview at http://127.0.0.1:4173
echo Keep this window open while using the app.
node ".\node_modules\vite\bin\vite.js" preview --host 127.0.0.1 --port 4173

if errorlevel 1 (
  echo.
  echo Preview stopped with an error.
  pause
)
