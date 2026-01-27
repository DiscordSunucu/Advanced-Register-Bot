@echo off
title DCSV Register Bot Setup
color 0a
cls

echo ==========================================
echo      DCSV REGISTER BOT KURULUMU
echo ==========================================
echo.

:: 1. Node.js Kontrolü
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] Node.js yuklu degil veya calismiyor!
    echo Lutfen https://nodejs.org/ adresinden Node.js yukleyin.
    pause
    exit
)

echo [OK] Node.js kontrol edildi.
echo.

:: 2. Config Kontrolü (.env)
if not exist .env (
    echo [.env] Dosyasi bulunamadi, olusturuluyor...
    echo.
    set /p bottoken="Lutfen BOT TOKEN'inizi yapistirin: "
    set /p apikey="Lutfen DCSV.ME API KEY'inizi yapistirin: "
    
    echo BOT_TOKEN=%bottoken%>.env
    echo API_KEY=%apikey%>>.env
    echo.
    echo [.env] Basariyla olusturuldu!
) else (
    echo [OK] Ayar dosyasi mevcut.
)
echo.

:: 3. Modülleri Yükle
if not exist node_modules (
    echo [NPM] Gerekli moduller indiriliyor... (Bu biraz zaman alabilir)
    call npm install
    if %errorlevel% neq 0 (
        echo [HATA] Moduller yuklenirken hata olustu!
        pause
        exit
    )
    echo [OK] Moduller yuklendi.
) else (
    echo [OK] Moduller zaten yuklu.
)
echo.

:: 4. Botu Başlat
echo ==========================================
echo      BOT BASLATILIYOR...
echo ==========================================
echo.
node src/index.js
pause
