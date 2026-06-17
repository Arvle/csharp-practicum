#!/usr/bin/env sh
set -eu
mkdir -p backups
STAMP=$(date +%Y%m%d_%H%M%S)
docker compose exec -T postgres pg_dump -U "${POSTGRES_USER:-csharp_admin}" "${POSTGRES_DB:-csharppracticum}" | gzip > "backups/csharppracticum_${STAMP}.sql.gz"
echo "Backup saved: backups/csharppracticum_${STAMP}.sql.gz"
