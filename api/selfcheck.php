<?php
/**
 * End-to-end check for the paths where being wrong costs money or access.
 *
 * Drives a real API over HTTP against a throwaway store, so routing, auth and
 * the SQLite schema are exercised the same way the till exercises them.
 *
 *   DB_FILE=/tmp/check.sqlite SEED_PASSWORD=selfcheck-password \
 *     php -S 127.0.0.1:8099 -t . api/router.php &
 *   php api/selfcheck.php http://127.0.0.1:8099/api selfcheck-password
 */

$BASE = $argv[1] ?? 'http://127.0.0.1:8099/api';
$PASSWORD = $argv[2] ?? 'selfcheck-password';
$failures = 0;
$checks = 0;

function check(string $what, bool $ok, string $detail = ''): void {
    global $failures, $checks;
    $checks++;
    if ($ok) {
        echo "  ok    {$what}\n";
        return;
    }
    $failures++;
    echo "  FAIL  {$what}" . ($detail !== '' ? " -- {$detail}" : '') . "\n";
}

function call(string $method, string $path, ?array $body = null, ?string $token = null): array {
    global $BASE;
    $headers = ['Accept: application/json'];
    if ($token) {
        $headers[] = "Authorization: Bearer {$token}";
    }
    if ($body !== null) {
        $headers[] = 'Content-Type: application/json';
    }

    $ch = curl_init($BASE . $path);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 10,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['status' => $status, 'body' => json_decode((string) $raw, true), 'raw' => (string) $raw];
}

function category_named(string $name, string $token): ?array {
    foreach (call('GET', '/admin/categories', null, $token)['body'] ?? [] as $c) {
        if ($c['name'] === $name) {
            return $c;
        }
    }
    return null;
}

echo "Self-check against {$BASE}\n\n";

// This script opens a register, rings up a sale and rewrites a category GST
// rate. Pointed at a real store it leaves all of that behind — which is exactly
// what happened once — so it refuses to run against one that already holds
// sales. Pass --force only when the target is genuinely disposable.
if (!in_array('--force', $argv, true)) {
    $probe = call('POST', '/auth/login', ['email' => 'owner@example.com', 'password' => $PASSWORD]);
    $existing = call('GET', '/admin/sales?limit=1', null, $probe['body']['token'] ?? null);
    $rows = $existing['body']['data'] ?? $existing['body']['sales'] ?? $existing['body'] ?? [];
    $count = $existing['body']['pagination']['total'] ?? (is_array($rows) ? count($rows) : 0);
    if ($count > 0) {
        echo "REFUSING: that store already has sales in it.\n";
        echo "This check writes test data — point it at a throwaway store instead:\n";
        echo "  DB_FILE=/tmp/check.sqlite SEED_PASSWORD=pw php -S 127.0.0.1:8099 -t . api/router.php\n";
        echo "Pass --force only if you really mean this one.\n";
        exit(2);
    }
}

// -- Authentication --------------------------------------------------------
echo "auth\n";
$login = call('POST', '/auth/login', ['email' => 'owner@example.com', 'password' => $PASSWORD]);
check('owner can sign in', $login['status'] === 200 && !empty($login['body']['token']), $login['raw']);
$token = $login['body']['token'] ?? '';

check('wrong password is rejected',
    call('POST', '/auth/login', ['email' => 'owner@example.com', 'password' => 'nope'])['status'] === 401);
check('no token means 401', call('GET', '/auth/me')['status'] === 401);
check('a tampered token is rejected', call('GET', '/auth/me', null, $token . 'x')['status'] === 401);
check('a valid token is accepted', call('GET', '/auth/me', null, $token)['status'] === 200);

// A correctly signed token has to stop working once it is revoked.
$second = call('POST', '/auth/login', ['email' => 'owner@example.com', 'password' => $PASSWORD])['body']['token'] ?? '';
check('logout revokes the token server-side',
    call('POST', '/auth/logout', [], $second)['status'] === 200
    && call('GET', '/auth/me', null, $second)['status'] === 401);

check('a short password is refused',
    call('POST', '/admin/users', ['name' => 'X', 'email' => 'x@example.com', 'password' => 'abc'], $token)['status'] === 400);
check('an unknown role is refused',
    call('POST', '/admin/users', ['name' => 'X', 'email' => 'x2@example.com', 'password' => 'longenough1', 'role' => 'ROOT'], $token)['status'] === 400);
check('404 leaks no routing internals',
    !str_contains(strtolower(call('GET', '/definitely-not-a-route', null, $token)['raw']), 'rawpath'));

// -- GST -------------------------------------------------------------------
echo "\ngst\n";
$snacks = category_named('Snacks', $token);
check('categories carry a GST rate', $snacks !== null && array_key_exists('effective_gst_rate', $snacks));

call('PUT', '/admin/categories/' . $snacks['id'], ['name' => 'Snacks', 'gst_rate' => 5], $token);
$snack = null;
foreach (call('GET', '/pos/products/search?limit=200', null, $token)['body'] ?? [] as $p) {
    if ((int) $p['category']['id'] === (int) $snacks['id']) {
        $snack = $p;
        break;
    }
}
check('a product reports its category GST rate',
    $snack && abs((float) $snack['gstRate'] - 5.0) < 0.001,
    'got ' . json_encode($snack['gstRate'] ?? null));

// Changing the rate has to change what the next bill quotes: that is the feature.
call('PUT', '/admin/categories/' . $snacks['id'], ['name' => 'Snacks', 'gst_rate' => 12], $token);
foreach (call('GET', '/pos/products/search?limit=200', null, $token)['body'] ?? [] as $p) {
    if ((int) $p['id'] === (int) $snack['id']) {
        $snack = $p;
    }
}
check('editing the rate flows straight through to the bill', abs((float) $snack['gstRate'] - 12.0) < 0.001);

call('PUT', '/admin/categories/' . $snacks['id'], ['name' => 'Snacks', 'gst_rate' => 900], $token);
check('an out-of-range rate is clamped, not stored raw',
    (float) category_named('Snacks', $token)['gst_rate'] === 100.0);

call('PUT', '/admin/categories/' . $snacks['id'], ['name' => 'Snacks', 'gst_rate' => 12], $token);
call('PUT', '/admin/categories/' . $snacks['id'], ['name' => 'Snacks'], $token);
check('renaming a category leaves its rate alone',
    (float) category_named('Snacks', $token)['gst_rate'] === 12.0);

// -- A real sale -----------------------------------------------------------
echo "\nsale\n";
$register = call('POST', '/register/open', ['openingCash' => 100], $token);
$registerId = $register['body']['registerId'] ?? $register['body']['id'] ?? null;
check('a register opens', $registerId !== null, $register['raw']);

if ($registerId) {
    $qty = 2;
    $expectedSubtotal = round((float) $snack['price'] * $qty, 2);
    $expectedTax = round($expectedSubtotal * 12 / 100, 2);

    $sale = call('POST', '/pos/sales', [
        'registerId' => $registerId,
        'items' => [['productId' => $snack['id'], 'quantity' => $qty]],
        'paymentMethod' => 'cash',
        // A till claiming zero tax must not be believed.
        'tax' => 0,
        'total' => 0.01,
    ], $token);

    check('the sale is accepted', $sale['status'] === 200, $sale['raw']);
    check('GST is charged at the category rate, not the rate the client sent',
        isset($sale['body']['tax']) && abs((float) $sale['body']['tax'] - $expectedTax) < 0.011,
        'expected ' . $expectedTax . ', got ' . json_encode($sale['body']['tax'] ?? null));
    check('the total is subtotal + GST',
        abs((float) ($sale['body']['total'] ?? 0) - ($expectedSubtotal + $expectedTax)) < 0.011,
        json_encode($sale['body'] ?? null));
    check('the bill carries a per-rate GST breakup',
        !empty($sale['body']['gstBreakup']) && abs((float) $sale['body']['gstBreakup'][0]['rate'] - 12.0) < 0.001);

    // A reprint shows the rate charged at the time, not one set afterwards.
    $saleId = $sale['body']['id'];
    call('PUT', '/admin/categories/' . $snacks['id'], ['name' => 'Snacks', 'gst_rate' => 28], $token);
    $reprint = call('GET', '/admin/sales/' . $saleId, null, $token);
    check('a reprint keeps the rate that was charged',
        abs((float) ($reprint['body']['items'][0]['gstRate'] ?? 0) - 12.0) < 0.001,
        json_encode($reprint['body']['items'][0]['gstRate'] ?? null));
}

echo "\n{$checks} checks, {$failures} failed\n";
exit($failures === 0 ? 0 : 1);
