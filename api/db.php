<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/schema.php';

function get_db(): PDO {
    global $CONFIG;
    static $pdo = null;
    if ($pdo) return $pdo;

    $file = $CONFIG['db']['file'];
    $dir = dirname($file);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    protect_data_dir($dir);

    $pdo = new PDO('sqlite:' . $file, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    // WAL keeps a read (e.g. the POS polling for products) from blocking the
    // write of a sale. foreign_keys is off by default in SQLite and the schema
    // leans on ON DELETE CASCADE / SET NULL, so it has to be turned on for
    // every connection.
    $pdo->exec('PRAGMA journal_mode = WAL');
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA busy_timeout = 5000');

    align_php_clock_to_machine($pdo);

    // First run (or after the .sqlite file is deleted to reset the store):
    // build the schema and load the demo catalog. Keyed off a table rather
    // than the file existing, because SQLite creates an empty file on connect.
    $installed = (int)$pdo
        ->query("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='users'")
        ->fetchColumn();
    if ($installed === 0) {
        install_schema($pdo);
        seed_store_data($pdo);
        $pdo->exec('PRAGMA user_version = ' . SCHEMA_VERSION);
    } else {
        migrate_schema($pdo);
    }

    return $pdo;
}

/**
 * Keep the SQLite file out of the webroot's reach.
 *
 * The data directory sits under api/, and an Apache vhost serves any real file
 * there directly — api/.htaccess only rewrites requests that miss the
 * filesystem. Without this a plain GET for /api/data/quickstop.sqlite hands
 * over every password hash, sale and customer record in the store. The parent
 * .htaccess denies the path as well; this file covers the case where DB_FILE
 * points somewhere else.
 */
function protect_data_dir(string $dir): void {
    $guard = $dir . '/.htaccess';
    if (is_file($guard)) return;
    file_put_contents(
        $guard,
        "# Never serve the store over HTTP.
Require all denied

<IfModule !mod_authz_core.c>
  Order allow,deny
  Deny from all
</IfModule>
",
        LOCK_EX
    );
}

/**
 * Put PHP's clock on the same wall time as SQLite's.
 *
 * Timestamps enter the database from two places: column defaults, which use
 * SQLite's datetime('now','localtime') and therefore follow the machine clock,
 * and PHP's date() for things like a purchase order's ordered_at. A stock XAMPP
 * php.ini pins date.timezone to Europe/Berlin, so on any other machine those two
 * disagree — and "today's sales" starts querying the wrong day. Deriving the
 * offset from SQLite on each connect keeps them aligned wherever this runs, and
 * follows DST without anyone editing a config file.
 */
function align_php_clock_to_machine(PDO $pdo): void {
    global $CONFIG;

    $configured = $CONFIG['app']['timezone'] ?? '';
    if ($configured !== '') {
        date_default_timezone_set($configured);
        return;
    }

    $offsetSeconds = (int)$pdo
        ->query("SELECT strftime('%s','now','localtime') - strftime('%s','now')")
        ->fetchColumn();
    // date_default_timezone_set() rejects bare "+05:30" offsets, so resolve the
    // offset to a real zone id. A false return just leaves php.ini's value.
    $zone = timezone_name_from_abbr('', $offsetSeconds, 0);
    if ($zone !== false) {
        date_default_timezone_set($zone);
    }
}

function pdo_try(callable $fn) {
    try {
        return $fn();
    } catch (Throwable $e) {
        // The message carries SQL fragments and absolute paths, which map out the
        // schema and install layout for anyone probing the API. It goes to the
        // server log; the caller gets the status and nothing else.
        error_log('[quickstop] ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Server error']);
        exit;
    }
}
