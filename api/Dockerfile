# PHP API for the point-of-sale system.
#
# Built for a host that gives you a container and a port — Render, Koyeb, Fly,
# Cloud Run, or a plain VM. Apache serves the api/ folder exactly as XAMPP does
# locally, so the .htaccess rewrite and the Authorization header pass-through
# behave the same way in both places.
#
#   docker build -f api/Dockerfile -t pos-api .
#   docker run --rm -p 8080:8080 -e PORT=8080 -e ALLOWED_ORIGINS='*' pos-api
#
# IMPORTANT: on a host without a persistent volume the store is rebuilt from the
# demo catalogue every time the container restarts. That is fine for a
# demonstration and wrong for a real shop — see DEPLOYMENT.md.

FROM php:8.2-apache

# The official PHP images usually ship pdo_sqlite already enabled, so this only
# builds it when it is genuinely missing. Running docker-php-ext-install against
# a built-in extension is a common way a Dockerfile like this fails on a host
# you cannot debug from. The check afterwards fails the build here rather than
# at the first database call.
RUN set -eux; \
    if ! php -m | grep -qi '^pdo_sqlite$'; then \
        apt-get update; \
        apt-get install -y --no-install-recommends libsqlite3-dev; \
        docker-php-ext-install pdo_sqlite; \
        rm -rf /var/lib/apt/lists/*; \
    fi; \
    php -m | grep -qi '^pdo_sqlite$'; \
    a2enmod rewrite headers

# The API leans on api/.htaccess for routing, for denying the data directory,
# and for forwarding the Authorization header. None of that applies unless
# overrides are allowed.
RUN printf '%s\n' \
    '<Directory /var/www/html>' \
    '    Options -Indexes +FollowSymLinks' \
    '    AllowOverride All' \
    '    Require all granted' \
    '</Directory>' \
    > /etc/apache2/conf-available/pos.conf \
    && a2enconf pos \
    && echo 'ServerName localhost' > /etc/apache2/conf-available/servername.conf \
    && a2enconf servername

# Only the API. .dockerignore keeps api/data out, so no real store, signing key
# or first-run password is ever baked into an image.
COPY api/ /var/www/html/api/

# The store is created on first request, so the directory has to be writable.
RUN mkdir -p /var/www/html/api/data \
    && chown -R www-data:www-data /var/www/html/api/data \
    && chmod 750 /var/www/html/api/data

# Hosts assign a port at runtime rather than using 80.
ENV PORT=8080
COPY api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
