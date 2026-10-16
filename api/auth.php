<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/config.php';

function bearer_token(): ?string {
    $headers = [];
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
    } else {
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
    }
    
    $auth = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;
    if (!$auth) return null;
    
    if (preg_match('/Bearer\s+(.*)$/i', $auth, $m)) {
        return trim($m[1]);
    }
    return null;
}

/**
 * Mint a session token for a user.
 *
 * The nonce is what makes each one unique. Keyed on user id and second alone,
 * two sign-ins for the same account inside the same second produced byte-identical
 * tokens — so a second till taking over the same login shared one session, and
 * either one signing out revoked both.
 */
function make_token(int $userId): string {
    global $CONFIG;
    $payload = $userId . '|' . time() . '|' . bin2hex(random_bytes(8));
    $sig = hash_hmac('sha256', $payload, $CONFIG['security']['token_secret']);
    return base64_encode($payload . '|' . $sig);
}

function parse_token(string $token): ?array {
    global $CONFIG;
    $decoded = base64_decode($token, true);
    if (!$decoded) return null;
    $parts = explode('|', $decoded);
    if (count($parts) !== 4) return null;
    [$userId, $ts, $nonce, $sig] = $parts;
    $expected = hash_hmac('sha256', $userId . '|' . $ts . '|' . $nonce, $CONFIG['security']['token_secret']);
    if (!hash_equals($expected, $sig)) return null;
    if ((time() - (int)$ts) > ($CONFIG['security']['token_ttl_hours'] * 3600)) return null;
    return ['user_id' => (int)$userId, 'ts' => (int)$ts];
}

/**
 * Drop a token so it stops authenticating. Used by logout.
 */
function revoke_token(string $token): void {
    get_db()->prepare('DELETE FROM user_tokens WHERE token = ?')->execute([$token]);
}

/**
 * Why a password is unacceptable, or null if it is fine.
 *
 * Shared by user creation and password reset so the two cannot drift: before
 * this, create accepted a single character while reset asked for six.
 */
function password_rejection($password): ?string {
    global $CONFIG;
    $min = $CONFIG['security']['password_min_length'];
    if (!is_string($password) || strlen($password) < $min) {
        return "Password must be at least {$min} characters";
    }
    return null;
}

function current_user(): ?array {
    $token = bearer_token();
    if (!$token) return null;
    $parsed = parse_token($token);
    if (!$parsed) return null;
    $pdo = get_db();

    // The HMAC and TTL only prove the token was minted here and is not yet
    // stale. One that has been logged out, or revoked along with its account,
    // has to stop working too — so the stored row is what actually authorises
    // the request, not the signature alone.
    $live = $pdo->prepare('SELECT 1 FROM user_tokens WHERE token = ? LIMIT 1');
    $live->execute([$token]);
    if (!$live->fetchColumn()) return null;

    $stmt = $pdo->prepare('SELECT id, name, email, role, active FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$parsed['user_id']]);
    $user = $stmt->fetch();
    if (!$user || !$user['active']) return null;
    return $user;
}

function require_auth(array $roles = []): array {
    $user = current_user();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    if ($roles && !in_array($user['role'], $roles, true)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
    return $user;
}
