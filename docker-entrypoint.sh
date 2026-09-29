#!/bin/sh
set -e

if [ ! -f "$TEA_SHOP_DB_PATH" ]; then
  echo "No existing database found at $TEA_SHOP_DB_PATH, seeding from template..."
  cp /app/tea_shop.db.seed "$TEA_SHOP_DB_PATH"
fi

exec "$@"
