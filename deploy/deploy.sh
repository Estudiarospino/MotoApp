#!/usr/bin/env bash
# Redeploy de producción: git pull (main) + build + migrate + pm2 restart.
# Se corre parado en la carpeta de producción (ej. /home/alvaro/Documentos/Produccion/MotoApp),
# nunca en la carpeta de desarrollo.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BRANCH="main"

cd "$ROOT_DIR"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  echo "ERROR: esta carpeta está en la rama '$CURRENT_BRANCH', no en '$BRANCH'. Abortando." >&2
  echo "       (este script es solo para la carpeta de producción, no para desarrollo)" >&2
  exit 1
fi

if [ ! -f .env ]; then
  echo "ERROR: falta .env en esta carpeta (DATABASE_URL, ADMIN_*). No se puede continuar." >&2
  exit 1
fi

echo "==> [1/4] git pull --ff-only origin $BRANCH"
git pull --ff-only origin "$BRANCH"

echo "==> [2/4] Instalando dependencias y generando el cliente de Prisma"
npm install
npx prisma generate

echo "==> [3/4] Aplicando migraciones pendientes y build de producción"
npx prisma migrate deploy
npm run build

echo "==> [4/4] Reiniciando motoapp en PM2"
pm2 restart motoapp --update-env || pm2 start ecosystem.config.js

echo "Deploy completo: $(date '+%Y-%m-%d %H:%M:%S')"
echo "(si cambiaste la config de Nginx a mano, recuerda: sudo nginx -t && sudo systemctl reload nginx)"
