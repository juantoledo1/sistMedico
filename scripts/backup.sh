#!/bin/bash
# Backup MongoDB — corre con cron semanal
# Uso: MONGO_URI="mongodb+srv://..." ./scripts/backup.sh

set -euo pipefail

MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/medflow}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="medflow_${DATE}.gz"

mkdir -p "$BACKUP_DIR"

echo "📦 Backing up MongoDB..."
mongodump \
  --uri="$MONGO_URI" \
  --gzip \
  --archive="$BACKUP_DIR/$FILENAME" \
  --quiet

echo "✅ Backup saved: $BACKUP_DIR/$FILENAME"
echo "   Size: $(du -h "$BACKUP_DIR/$FILENAME" | cut -f1)"

# Limpiar backups viejos (>30 días)
find "$BACKUP_DIR" -name "medflow_*.gz" -mtime +30 -delete
echo "🧹 Old backups cleaned (retain 30 days)"
