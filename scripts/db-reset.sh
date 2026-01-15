#!/bin/bash
#
# データベースリセットスクリプト
# PostgreSQL データベースを drop/create し、マイグレーションを適用後、シードを実行します
#

set -e

# 色付きログ出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# 設定
CONTAINER_NAME="wishlist-postgres"
DB_NAME="wishlist_db"
DB_USER="wishlist_user"

# コンテナが起動しているか確認
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  log_error "PostgreSQL コンテナ (${CONTAINER_NAME}) が起動していません"
  log_info "docker-compose up -d postgres を実行してください"
  exit 1
fi

log_info "データベースリセットを開始します..."

# 1. アクティブな接続を切断してデータベースを DROP
log_info "既存の接続を切断し、データベースを削除中..."
docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d postgres <<EOF
-- アクティブな接続を強制切断
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '${DB_NAME}'
  AND pid <> pg_backend_pid();

-- データベースを DROP（存在する場合）
DROP DATABASE IF EXISTS ${DB_NAME};
EOF

# 2. データベースを CREATE
log_info "データベースを作成中..."
docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d postgres <<EOF
CREATE DATABASE ${DB_NAME};
EOF

log_info "データベースが正常にリセットされました"

# 3. Prisma マイグレーションを適用
log_info "Prisma マイグレーションを適用中..."
pnpm prisma migrate deploy

# 4. シードを実行
log_info "シードを実行中..."
pnpm run db:seed

log_info "データベースリセットが完了しました!"
