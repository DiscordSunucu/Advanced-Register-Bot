#!/bin/bash

# Renkler
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}      DCSV REGISTER BOT KURULUMU${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""

# 1. Node.js Kontrolü
if ! command -v node &> /dev/null
then
    echo -e "${RED}[HATA] Node.js yuklu degil!${NC}"
    echo "Lutfen Node.js yukleyin (sudo apt install nodejs npm)"
    exit 1
fi

echo -e "${GREEN}[OK] Node.js kontrol edildi.${NC}"

# 2. Config Kontrolü (.env)
if [ ! -f .env ]; then
    echo "[.env] Dosyasi bulunamadi, olusturuluyor..."
    echo ""
    read -p "Lutfen BOT TOKEN'inizi yapistirin: " bottoken
    read -p "Lutfen API KEY'inizi yapistirin (Yoksa Enter'a basin): " apikey
    
    echo "BOT_TOKEN=$bottoken" > .env
    echo "API_KEY=$apikey" >> .env
    echo ""
    echo -e "${GREEN}[.env] Basariyla olusturuldu!${NC}"
else
    echo -e "${GREEN}[OK] Ayar dosyasi mevcut.${NC}"
fi

# 3. Modülleri Yükle
if [ ! -d "node_modules" ]; then
    echo "[NPM] Gerekli moduller indiriliyor..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}[HATA] Moduller yuklenirken hata olustu!${NC}"
        exit 1
    fi
    echo -e "${GREEN}[OK] Moduller yuklendi.${NC}"
else
    echo -e "${GREEN}[OK] Moduller zaten yuklu.${NC}"
fi

# 4. Botu Başlat
echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}      BOT BASLATILIYOR...${NC}"
echo -e "${GREEN}==========================================${NC}"
node src/index.js
