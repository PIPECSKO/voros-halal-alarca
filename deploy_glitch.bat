@echo off
echo.
echo ===============================================
echo    VOROS HALAL ALARCA - GLITCH.COM TELEPITES
echo ===============================================
echo.

echo [1] Projekt ellenorzese...
if not exist "package.json" (
    echo HIBA: package.json nem talalhato!
    pause
    exit /b 1
)

if not exist "server\index.js" (
    echo HIBA: server\index.js nem talalhato!
    pause
    exit /b 1
)

echo ✅ Minden fajl megvan!
echo.

echo [2] Fuggosegek telepitese...
call npm install
if %errorlevel% neq 0 (
    echo HIBA: npm install sikertelen!
    pause
    exit /b 1
)

echo.
echo [3] Lokalis teszt inditasa...
echo Szerver indul a 3001-es porton...
echo.
echo FONTOS: Teszteld lokálisan mielőtt feltöltöd!
echo URL: http://localhost:3001
echo.

start "Local Test" cmd /k "npm start"

echo.
echo [4] GLITCH.COM TELEPITES:
echo.
echo 🌐 1. Menj ide: https://glitch.com
echo 📁 2. Kattints: "New Project"
echo 📤 3. Valaszd: "Import from GitHub"
echo 🔗 4. Add meg a GitHub repo URL-t
echo ⏳ 5. Varj 1-2 percet
echo 🎮 6. Kapsz egy URL-t: https://your-project.glitch.me
echo.

echo [5] Dokumentacio megnyitasa...
start GLITCH_SETUP.md

echo.
echo ===============================================
echo    GLITCH.COM TELEPITES KESZ!
echo ===============================================
echo.
echo 🚀 KOVETKEZO LEPESEK:
echo.
echo 1. Teszteld a lokalis szervert: http://localhost:3001
echo 2. Ha minden OK, menj a Glitch.com-ra
echo 3. Import from GitHub vagy huzd be a zip-et
echo 4. Varj 1-2 percet
echo 5. Teszteld az online verziót
echo 6. Oszd meg a linket barataiddal!
echo.
echo 📖 Reszletes utmutato: GLITCH_SETUP.md
echo.
echo Nyomj egy billentyut a kilepes...
pause > nul 