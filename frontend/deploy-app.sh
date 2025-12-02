#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------
# USO:
#   ./deploy-app.sh -h   → deploy homolog
#   ./deploy-app.sh -p   → deploy production
# ---------------------------------------

# Descobre pasta do script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ==========================
# PARÂMETROS
# ==========================
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

# ==========================
# CONFIGURAÇÕES POR AMBIENTE
# ==========================
if [[ "$ENVIRONMENT" == "homolog" ]]; then
  REMOTE_APP_DIR="/var/www/synvia/app-homolog"
  PACKAGE_NAME="synvia-frontend-homolog.tar.gz"
  DEPLOY_URL="https://homolog.synviabrasil.com"
else
  REMOTE_APP_DIR="/var/www/synvia/app"
  PACKAGE_NAME="synvia-frontend-production.tar.gz"
  DEPLOY_URL="https://app.synviabrasil.com"
fi

REMOTE_HOST="synvia-ec2"
REMOTE_USER="ubuntu"
REMOTE_TMP_PACKAGE="/tmp/${PACKAGE_NAME}"

BUILD_CMD="pnpm install --frozen-lockfile && VITE_APP_ENV=${ENVIRONMENT} pnpm build"
BUILD_DIR="dist"

echo "🌍 Deploy FRONT → $DEPLOY_URL"
echo "📁 Diretório remoto: $REMOTE_APP_DIR"
echo "⚙ APP_ENV usado no build: $ENVIRONMENT"

# ==========================
# 1) Build
# ==========================
echo "1️⃣  Rodando build local..."
eval "$BUILD_CMD"

if [ ! -d "$BUILD_DIR" ]; then
  echo "❌ Build não encontrado na pasta '${BUILD_DIR}'"
  exit 1
fi

# ==========================
# 2) Compactar build
# ==========================
echo "2️⃣  Compactando build em $PACKAGE_NAME..."
tar -czf "$PACKAGE_NAME" -C "$BUILD_DIR" .

# ==========================
# 3) Enviar para EC2
# ==========================
echo "3️⃣  Enviando pacote para $REMOTE_HOST..."
scp "$PACKAGE_NAME" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_TMP_PACKAGE}"

# ==========================
# 4) Deploy remoto
# ==========================
echo "4️⃣  Aplicando deploy remoto..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" bash << EOF
  set -euo pipefail

  echo "📁 Criando diretório destino se não existir: ${REMOTE_APP_DIR}"
  sudo mkdir -p "${REMOTE_APP_DIR}"

  echo "🧹 Limpando conteúdo antigo..."
  sudo rm -rf "${REMOTE_APP_DIR:?}/"*

  echo "📦 Extraindo novo build..."
  sudo tar -xzf "${REMOTE_TMP_PACKAGE}" -C "${REMOTE_APP_DIR}"

  echo "🗑 Removendo pacote temporário..."
  sudo rm -f "${REMOTE_TMP_PACKAGE}"

  echo "🔐 Ajustando permissões para www-data"
  sudo chown -R www-data:www-data "${REMOTE_APP_DIR}"

  echo "🔁 Recarregando Nginx..."
  sudo systemctl reload nginx
EOF

# ==========================
# 5) Cleanup local
# ==========================
echo "5️⃣  Removendo pacote local..."
rm -f "$PACKAGE_NAME"

echo "🎉 Deploy concluído com sucesso!"
echo "➡ Acesse: ${DEPLOY_URL}"
