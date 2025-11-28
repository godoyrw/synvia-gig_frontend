#!/usr/bin/env bash
set -euo pipefail

###
# DEPLOY MICROSERVICES - HOMOLOG
# Path destino: /var/www/synvia/microservices-homolog
# URL: https://microservices-homolog.synviabrasil.com/
###

# Usuário + Host SSH
REMOTE_USER="ubuntu"
REMOTE_HOST="synvia-ec2"  # alias no ~/.ssh/config

# Diretório remoto onde o projeto estará
REMOTE_BASE_DIR="/var/www/synvia/microservices-homolog"

# Diretório local do código (monorepo/microservices)
LOCAL_SRC_DIR="$(pwd)"

# Comando executado no servidor após enviar o código
# (ajuste se NÃO usar docker compose)
REMOTE_BUILD_CMD="cd ${REMOTE_BASE_DIR} && docker compose up -d --build"

echo "🚀 Deploy MICROSERVICES -> microservices-homolog.synviabrasil.com"

echo "1) Enviando código via rsync..."
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

echo "2) Executando build remoto..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" bash << EOF
  set -euo pipefail

  echo " - Indo para ${REMOTE_BASE_DIR}"
  cd "${REMOTE_BASE_DIR}"

  echo " - Rodando docker compose..."
  ${REMOTE_BUILD_CMD}

  echo " - Ajustando permissões..."
  sudo chown -R ubuntu:ubuntu "${REMOTE_BASE_DIR}"

  echo "✅ Microserviços Homolog atualizados!"
EOF

echo "🎉 DONE: microservices-homolog.synviabrasil.com atualizado com sucesso."
