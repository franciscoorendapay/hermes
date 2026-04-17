#!/bin/bash

echo "🚀 Iniciando Backend Symfony..."
cd api

composer install --no-scripts

php -S localhost:8000 -t public/ &

echo "⏳ Aguardando backend subir..."
sleep 3

cd ..

echo "⚛️ Iniciando Frontend React..."
cd app

# Só instala se necessário
if [ ! -d "node_modules" ]; then
  npm install
fi

# Limpa cache zoado do Vite
rm -rf node_modules/.vite

npm run dev