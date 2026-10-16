<?php
// Local configuration.
//
// The whole system runs off a single SQLite file, so there is no database
// server to install, start, or hand credentials to. Everything below has a
// working local default; the env vars exist only so the file location or the
// token secret can be overridden without editing code.

function env_str(string $key, string $default): string {
    $v = getenv($key);
    return ($v === false || $v === '') ? $default : $v;
}

function env_int(string $key, int $default): int {
    $v = getenv($key);
    return ($v === false || $v === '') ? $default : (int) $v;
}

/**
 * Signing key for login tokens.
 *
 * Set TOKEN_SECRET in the environment for any shared or hosted install. With
 * it unset we generate one and keep it beside the database rather than ship a
 * constant in source: a default key published with the code lets anyone who
 * has read the repo mint a valid owner token for any deployment still using it.
 */
function token_secret(string $dbFile): string {
    $env = getenv('TOKEN_SECRET');
    if ($env !== false && $env !== '') {
        return $env;
    }

    $dir = dirname($dbFile);
    $path = $dir . '/.token_secret';
    if (is_file($path)) {
        $existing = trim((string) file_get_contents($path));
        if ($existing !== '') {
            return $existing;
        }
    }
    if (!is_dir($dir)) {
        mkdir($dir, 0700, true);
    }
    $secret = bin2hex(random_bytes(32));
    file_put_contents($path, $secret, LOCK_EX);
    @chmod($path, 0600);
    return $secret;
}

// Single-file SQLite database. Created and seeded on first request.
// Delete this file to reset the store back to the demo catalog.
$DB_FILE = env_str('DB_FILE', __DIR__ . '/data/quickstop.sqlite');

$CONFIG = [
    'db' => [
        'file' => $DB_FILE,
    ],
    'app' => [
        // Leave empty to follow the machine's own timezone (see
        // align_php_clock_to_machine in db.php). Set to an id like
        // "America/Chicago" to pin the store to a fixed zone.
        'timezone' => env_str('APP_TIMEZONE', ''),
        // GST percentage applied to a product whose category has no rate set
        // (or no category at all). Per-category rates live in categories.gst_rate
        // and are edited under Admin -> GST & Tax.
        'default_gst_rate' => (float) env_str('DEFAULT_GST_RATE', '8.25'),
    ],
    'security' => [
        'token_secret'      => token_secret($DB_FILE),
        'token_ttl_hours'   => env_int('TOKEN_TTL_HOURS', 168), // 7 days
        // Failed logins allowed from one IP inside the window before the next
        // attempt is refused outright.
        'login_max_attempts' => env_int('LOGIN_MAX_ATTEMPTS', 8),
        'login_window_min'   => env_int('LOGIN_WINDOW_MINUTES', 15),
        'password_min_length' => env_int('PASSWORD_MIN_LENGTH', 8),
    ],
    'cors' => [
        // Comma-separated allowlist of exact origins, e.g.
        // "https://pos.example.com,https://admin.example.com".
        // The default "*" allows loopback origins only (the Next dev server on
        // another port); it does not reflect arbitrary sites back with
        // credentials enabled.
        'allowed_origins' => env_str('ALLOWED_ORIGINS', '*'),
    ],
];
