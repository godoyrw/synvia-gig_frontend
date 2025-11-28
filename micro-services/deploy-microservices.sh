#!/usr/bin/env bash
set -euo pipefail

# Sempre usar a pasta onde ESTE script está (micro-services/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_SRC_DIR="${SCRIPT_DIR}"

# USO:
#   ./deploy-microservices.sh -h   → deploy HOMOLOG
#   ./deploy-microservices.sh -p   → deploy PRODUCTION
# Pode rodar da raiz do projeto ou de dentro de micro-services/

ENVIRONMENT=""
while getopts "hp" opt; do
  case "$opt" in
    h) ENVIRONMENT="homolog" ;;
    p) ENVIRONMENT="production" ;;
    *) echo "⚠️  Uso: $0 [-h | -p]"; exit 1 ;;
  esac
done

if [[ -z "$ENVIRONMENT" ]]; then
  echo "⚠️  Informe o ambiente: -h (homolog) ou -p (production)"
  exit 1
fi

echo "📌 Ambiente selecionado: $ENVIRONMENT"

if [[ "$ENVIRONMENT" == "homolog" ]]; then
  REMOTE_BASE_DIR="/var/www/synvia/microservices-homolog"
  SERVICE_URL="https://microservices-homolog.synviabrasil.com"
  PM2_NAME="synvia-micro-homolog"
else
  REMOTE_BASE_DIR="/var/www/synvia/microservices"
  SERVICE_URL="https://microservices.synviabrasil.com"
  PM2_NAME="synvia-micro-prod"
fi

REMOTE_USER="ubuntu"
REMOTE_HOST="synvia-ec2"

echo "🚀 Deploy MICROSERVICES → $SERVICE_URL"
echo "📁 Diretório remoto: $REMOTE_BASE_DIR"
echo "🧠 PM2 app name: $PM2_NAME"
echo "📂 LOCAL_SRC_DIR: $LOCAL_SRC_DIR"
echo "-------------------------------------"

echo "0️⃣  Preparando diretório remoto (mkdir + chown)..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" bash << EOF
  set -euo pipefail
  sudo mkdir -p "${REMOTE_BASE_DIR}"
  sudo chown -R ${REMOTE_USER}:${REMOTE_USER} "${REMOTE_BASE_DIR}"
EOF

echo "1️⃣  Enviando código via rsync..."
rsync -avz --delete \
  --exclude=".git" \
  --exclude=".idea" \
  --exclude=".vscode" \
  --exclude="node_modules" \
  --exclude="vendor" \
  --exclude="dist" \
  --exclude="coverage" \
  --exclude="tmp" \
  --exclude="logs" \
  --exclude="*.log" \
  --exclude=".env" \
  "${LOCAL_SRC_DIR}/" \
  "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_BASE_DIR}/"

echo "2️⃣  Instalando deps, buildando e (re)iniciando PM2..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" bash << EOF
  set -euo pipefail

  cd "${REMOTE_BASE_DIR}"

  echo " - pnpm install --no-frozen-lockfile"
  pnpm install --no-frozen-lockfile

  echo " - pnpm build"
  pnpm build

  echo " - Gerenciando processo PM2 (${PM2_NAME})"
  if pm2 list | grep -q "${PM2_NAME}"; then
    echo "   → Reiniciando ${PM2_NAME}..."
    pm2 restart "${PM2_NAME}"
  else
    echo "   → Iniciando ${PM2_NAME}..."
    pm2 start dist/server.js --name "${PM2_NAME}" --time
  fi

  pm2 save

  echo "✅ Microserviços (${ENVIRONMENT}) atualizados e rodando."
EOF

echo "🎉 DONE: ${SERVICE_URL} atualizado com sucesso."
