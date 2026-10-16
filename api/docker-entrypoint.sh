#!/bin/sh
# Apache listens on whatever port the host hands us. Render, Koyeb and Cloud Run
# all pass it in $PORT and none of them use 80.
set -e

PORT="${PORT:-8080}"
sed -ri "s/^Listen .*/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s!<VirtualHost \*:[0-9]+>!<VirtualHost *:${PORT}>!" /etc/apache2/sites-available/000-default.conf

# The data directory is a fresh empty layer on a host without a volume, so its
# ownership is re-applied here rather than relying on the build.
mkdir -p /var/www/html/api/data
chown -R www-data:www-data /var/www/html/api/data

if [ -z "$TOKEN_SECRET" ]; then
  echo "[pos] TOKEN_SECRET is not set — one will be generated and will change on every restart, signing everyone out." >&2
fi
if [ -z "$ALLOWED_ORIGINS" ]; then
  echo "[pos] ALLOWED_ORIGINS is not set — the browser will block calls from anywhere but localhost." >&2
fi

exec "$@"
