#!/bin/bash

echo "🚀 Iniciando Backend Symfony..."
cd api
composer install
if [ -f "compose.yaml" ]; then
    docker compose up -d
else
    symfony serve -d
fi
cd ..


echo "⚛️ Iniciando Frontend React..."
cd app
npm install  
npm run dev