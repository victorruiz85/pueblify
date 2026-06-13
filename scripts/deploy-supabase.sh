#!/usr/bin/env bash
# Despliegue del esquema de Pueblify a un proyecto Supabase con la CLI.
# NO crea funcionalidades: solo aplica migraciones, seed opcional y verifica RLS.
#
# Requisitos: Supabase CLI instalada (https://supabase.com/docs/guides/cli),
# y el PROJECT_REF de tu proyecto (Dashboard → Project Settings → General).
#
# Uso:
#   ./scripts/deploy-supabase.sh <PROJECT_REF>
#
# Variables opcionales:
#   SUPABASE_DB_URL  Cadena de conexión Postgres (para psql en seed/RLS).
#                    Dashboard → Project Settings → Database → Connection string (URI).

set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT_REF="${1:-}"
if [ -z "$PROJECT_REF" ]; then
  echo "Uso: $0 <PROJECT_REF>"
  exit 1
fi

echo "==> 1/5  supabase login"
supabase login

echo "==> 2/5  supabase link --project-ref $PROJECT_REF"
supabase link --project-ref "$PROJECT_REF"

echo "==> 3/5  supabase db push  (aplica supabase/migrations/*.sql)"
supabase db push

echo "==> 4/5  Seed opcional (catálogo de ejemplo)"
read -r -p "    ¿Cargar supabase/seed.sql? [y/N] " ans
if [[ "${ans:-N}" =~ ^[Yy]$ ]]; then
  if supabase db push --include-seed; then
    echo "    Seed aplicado con db push --include-seed."
  elif [ -n "${SUPABASE_DB_URL:-}" ]; then
    psql "$SUPABASE_DB_URL" -f supabase/seed.sql
  else
    echo "    No se pudo aplicar el seed automáticamente."
    echo "    Pégalo en el SQL Editor o define SUPABASE_DB_URL y reejecuta."
  fi
fi

echo "==> 5/5  Verificación de RLS por rol"
if [ -n "${SUPABASE_DB_URL:-}" ]; then
  psql "$SUPABASE_DB_URL" -f supabase/rls_checks.sql
else
  echo "    Define SUPABASE_DB_URL para correrlo aquí, o pega"
  echo "    supabase/rls_checks.sql en el SQL Editor y pulsa Run."
fi

echo "==> Hecho. Recuerda configurar .env.local (ver DESPLIEGUE.md) antes de 'npm run dev'."
