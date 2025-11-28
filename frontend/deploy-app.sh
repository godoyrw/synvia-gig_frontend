#!/usr/bin/env bash
set -euo pipefail

### CONFIGURAÇÕES ###

# Usuário/host SSH
REMOTE_USER="ubuntu"

REMOTE_HOST="synvia-ec2" # alias no ~/.ssh/config

# Diretório do app no servidor
REMOTE_APP_DIR="/var/www/synvia/app-homolog"

# Comando de build local (ajuste se usar npm/yarn)
BUILD_CMD="pnpm install --frozen-lockfile && pnpm build"
BUILD_DIR="dist"

# Pacote temporário
PACKAGE_NAME="synvia-frontend-homolog.tar.gz"
REMOTE_TMP_PACKAGE="/tmp/${PACKAGE_NAME}"

#####################

echo "🚀 Deploy FRONT -> homolog.synviabrasil.com"

echo "1) Rodando build local..."
eval "$BUILD_CMD"

if [ ! -d "$BUILD_DIR" ]; then
  echo "❌ Diretório de build '$BUILD_DIR' não encontrado."
  exit 1
fi

echo "2) Empacotando build em ${PACKAGE_NAME}..."
tar -czf "$PACKAGE_NAME" -C "$BUILD_DIR" .

echo "3) Enviando pacote para o servidor (${REMOTE_HOST})..."
scp "$PACKAGE_NAME" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_TMP_PACKAGE}"

echo "4) Aplicando deploy remoto em ${REMOTE_APP_DIR}..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" bash << EOF
  set -euo pipefail

  echo " - Criando diretório destino (se não existir): ${REMOTE_APP_DIR}"
  sudo mkdir -p "${REMOTE_APP_DIR}"

  echo " - Limpando conteúdo antigo..."
  sudo rm -rf "${REMOTE_APP_DIR:?}/"*

  echo " - Extraindo novo build..."
  sudo tar -xzf "${REMOTE_TMP_PACKAGE}" -C "${REMOTE_APP_DIR}"

  echo " - Removendo pacote temporário..."
  sudo rm -f "${REMOTE_TMP_PACKAGE}"

  echo " - Ajustando permissões para www-data..."
  sudo chown -R www-data:www-data "${REMOTE_APP_DIR}"

  echo " - Recarregando Nginx..."
  sudo systemctl reload nginx

  echo "✅ Deploy FRONT concluído em https://homolog.synviabrasil.com/"
EOF

echo "5) Limpando pacote local..."
rm -f "$PACKAGE_NAME"

echo "🎉 DONE: homolog.synviabrasil.com atualizado."
