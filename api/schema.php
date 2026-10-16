<?php
// SQLite schema and first-run store data.
//
// install_schema() is idempotent (every statement is CREATE ... IF NOT EXISTS)
// and seed_store_data() only runs when the database is brand new, so deleting
// deleting the SQLite file named by DB_FILE is the supported way to reset it.
//
// A store that already exists is brought forward by migrate_schema(), gated on
// SQLite's own PRAGMA user_version so an unchanged database costs one integer
// read per connect and nothing else.

const SCHEMA_VERSION = 1;

function install_schema(PDO $pdo): void {
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'CASHIER' CHECK (role IN ('OWNER','MANAGER','CASHIER')),
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS user_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    // gst_rate is a percentage (18 means 18%). NULL means "no rate chosen",
    // and the sale falls back to app.default_gst_rate — so adding a category
    // never silently drops it to 0% tax.
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        gst_rate REAL,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_name TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        terms TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    )");

    // is_alcohol is the age-restriction flag. The name is historical; it gates
    // the POS age prompt for anything the law cards for — beer, spirits, vapes
    // and tobacco alike. bottle_size doubles as the pack/size label (750ml,
    // 184g, 5000 puffs, 20 ct).
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER,
        name TEXT NOT NULL,
        sku TEXT NOT NULL UNIQUE,
        barcode TEXT,
        brand TEXT,
        is_alcohol INTEGER NOT NULL DEFAULT 0,
        mrp REAL DEFAULT 0,
        bottle_size TEXT,
        cost_price REAL DEFAULT 0,
        price REAL NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        low_stock_threshold INTEGER NOT NULL DEFAULT 10,
        image_url TEXT,
        supplier_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS registers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        opening_cash REAL NOT NULL DEFAULT 0,
        current_cash REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED')),
        opened_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        closed_at TEXT
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cashier_id INTEGER NOT NULL,
        register_id INTEGER NOT NULL,
        opening_cash REAL,
        started_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED')),
        FOREIGN KEY (cashier_id) REFERENCES users(id),
        FOREIGN KEY (register_id) REFERENCES registers(id)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        register_id INTEGER,
        subtotal REAL NOT NULL,
        tax REAL NOT NULL,
        total REAL NOT NULL,
        cash_amount REAL NOT NULL DEFAULT 0,
        card_amount REAL NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','card','upi','wallet','split')),
        age_verified INTEGER NOT NULL DEFAULT 0,
        receipt_number TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
        FOREIGN KEY (register_id) REFERENCES registers(id) ON DELETE SET NULL
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        category_name TEXT,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        subtotal REAL NOT NULL,
        gst_rate REAL NOT NULL DEFAULT 0,
        tax REAL NOT NULL DEFAULT 0,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS payment_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        method TEXT NOT NULL CHECK (method IN ('CASH','CARD','UPI','WALLET')),
        amount REAL NOT NULL,
        reference TEXT,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        email TEXT,
        phone TEXT,
        gift_receipt INTEGER NOT NULL DEFAULT 0,
        receipt_url TEXT,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS held_bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS held_bill_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (bill_id) REFERENCES held_bills(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS purchase_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ORDERED','RECEIVED','CANCELLED')),
        ordered_at TEXT,
        received_at TEXT,
        created_by INTEGER,
        notes TEXT,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS purchase_order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        ordered_qty INTEGER NOT NULL,
        received_qty INTEGER NOT NULL DEFAULT 0,
        cost_price REAL NOT NULL,
        FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS promotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        discount_type TEXT NOT NULL CHECK (discount_type IN ('PERCENT','AMOUNT')),
        discount_value REAL NOT NULL,
        start_at TEXT,
        end_at TEXT,
        category_id INTEGER,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        FOREIGN KEY (category_id) REFERENCES categories(id)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS customer_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT UNIQUE,
        loyalty_points INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS customer_purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        sale_id INTEGER NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customer_profiles(id),
        FOREIGN KEY (sale_id) REFERENCES sales(id)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS refunds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        processed_by INTEGER NOT NULL,
        approved_by INTEGER,
        reason TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        FOREIGN KEY (sale_id) REFERENCES sales(id),
        FOREIGN KEY (processed_by) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS refund_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        refund_id INTEGER NOT NULL,
        sale_item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        amount REAL NOT NULL,
        restocked INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (refund_id) REFERENCES refunds(id) ON DELETE CASCADE,
        FOREIGN KEY (sale_item_id) REFERENCES sale_items(id)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        details TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )");

    $indexes = [
        'CREATE INDEX IF NOT EXISTS idx_user_tokens_user ON user_tokens(user_id)',
        // current_user() looks a bearer token up on every authenticated request.
        'CREATE INDEX IF NOT EXISTS idx_user_tokens_token ON user_tokens(token)',
        // Backs the failed-login lookback in the login route.
        'CREATE INDEX IF NOT EXISTS idx_audit_action_created ON audit_logs(action, created_at)',
        'CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)',
        'CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)',
        'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)',
        'CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id)',
        'CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock)',
        'CREATE INDEX IF NOT EXISTS idx_sessions_cashier ON sessions(cashier_id)',
        'CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status)',
        'CREATE INDEX IF NOT EXISTS idx_sales_session ON sales(session_id)',
        'CREATE INDEX IF NOT EXISTS idx_sales_register ON sales(register_id)',
        'CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at)',
        'CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id)',
        'CREATE INDEX IF NOT EXISTS idx_payment_records_sale ON payment_records(sale_id)',
        'CREATE INDEX IF NOT EXISTS idx_refund_items_sale_item ON refund_items(sale_item_id)',
    ];
    foreach ($indexes as $index) {
        $pdo->exec($index);
    }
}

/**
 * Bring an existing store up to SCHEMA_VERSION.
 *
 * Each step is additive and re-runnable; ADD COLUMN is wrapped because SQLite
 * has no IF NOT EXISTS for it and throws on a column that is already there.
 */
function migrate_schema(PDO $pdo): void {
    $version = (int) $pdo->query('PRAGMA user_version')->fetchColumn();
    if ($version >= SCHEMA_VERSION) return;

    if ($version < 1) {
        add_column($pdo, 'categories', 'gst_rate REAL');
        add_column($pdo, 'sale_items', 'gst_rate REAL NOT NULL DEFAULT 0');
        add_column($pdo, 'sale_items', 'tax REAL NOT NULL DEFAULT 0');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_user_tokens_token ON user_tokens(token)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_audit_action_created ON audit_logs(action, created_at)');
    }

    $pdo->exec('PRAGMA user_version = ' . SCHEMA_VERSION);
}

function add_column(PDO $pdo, string $table, string $definition): void {
    try {
        $pdo->exec("ALTER TABLE {$table} ADD COLUMN {$definition}");
    } catch (PDOException $e) {
        // "duplicate column name" — the migration already ran against this file.
        if (stripos($e->getMessage(), 'duplicate column') === false) {
            throw $e;
        }
    }
}

/**
 * The password the two seeded logins are created with.
 *
 * A constant here would be a published credential: every fresh install would
 * answer owner@example.com with a password anyone can read in this file, and
 * a store put online before the owner changes it is simply open. So unless
 * SEED_PASSWORD says otherwise we generate one and write it beside the
 * database, where the person installing the store can read it once and the web
 * server will not serve it.
 */
function seed_password(string $dbFile): string {
    $configured = getenv('SEED_PASSWORD');
    if ($configured !== false && $configured !== '') {
        return $configured;
    }

    $plain = bin2hex(random_bytes(6)); // 12 hex characters
    $path = dirname($dbFile) . '/FIRST-RUN-PASSWORD.txt';
    file_put_contents(
        $path,
        "First-run logins

"
        . "  owner@example.com   {$plain}
"
        . "  manager@example.com {$plain}

"
        . "Change both passwords under Admin -> Users, then delete this file.
",
        LOCK_EX
    );
    @chmod($path, 0600);
    return $plain;
}

/**
 * The demo catalog: two staff logins, two suppliers, four aisles and
 * twelve products. Deliberately small — it is a starting shelf, not an
 * inventory. Add the real stock through Admin → Products or the CSV import.
 */
function seed_store_data(PDO $pdo): void {
    global $CONFIG;

    $plain = seed_password($CONFIG['db']['file']);
    $password = password_hash($plain, PASSWORD_DEFAULT);
    $userInsert = $pdo->prepare('INSERT INTO users (name, email, password_hash, role, active) VALUES (?,?,?,?,1)');
    $userInsert->execute(['Owner', 'owner@example.com', $password, 'OWNER']);
    $userInsert->execute(['Manager', 'manager@example.com', $password, 'MANAGER']);

    $supplierInsert = $pdo->prepare('INSERT INTO suppliers (name, contact_name, phone, email, terms) VALUES (?,?,?,?,?)');
    $supplierInsert->execute(['Midtown Beverage Distributors', 'Dana Ruiz', '555-0142', 'orders@midtownbev.example', 'Net 30, delivery Tue & Fri']);
    $supplierInsert->execute(['Harbor Snack & Vape Supply', 'Ellis Tran', '555-0177', 'sales@harborsupply.example', 'Net 15, delivery Wed']);
    $BEVERAGE_SUPPLIER = 1;
    $SNACK_SUPPLIER = 2;

    $categoryInsert = $pdo->prepare('INSERT INTO categories (name, gst_rate) VALUES (?, ?)');
    $categoryIds = [];
    // Starting rates only — the owner sets the real ones under Admin -> GST & Tax.
    foreach (['Beer & Alcohol' => 28, 'Soft Drinks & Energy' => 12, 'Snacks' => 5, 'Vapes & Tobacco' => 28] as $categoryName => $gstRate) {
        $categoryInsert->execute([$categoryName, $gstRate]);
        $categoryIds[$categoryName] = (int)$pdo->lastInsertId();
    }

    // age_restricted drives the POS age prompt (stored in products.is_alcohol).
    $products = [
        // Beer & Alcohol
        ['Modelo Especial 12-Pack Cans', 'BEER-MOD-12PK', '049000050165', 'Modelo', 'Beer & Alcohol', '12 x 355ml', 16.99, 18.99, 11.50, 24, 6, 1, $BEVERAGE_SUPPLIER],
        ['White Claw Hard Seltzer Variety 6-Pack', 'BEER-WCL-6PK', '635985101234', 'White Claw', 'Beer & Alcohol', '6 x 355ml', 12.49, 13.99, 8.25, 30, 8, 1, $BEVERAGE_SUPPLIER],
        ['Jack Daniels Old No. 7 Whiskey', 'SPIR-JD-750', '082184090563', 'Jack Daniels', 'Beer & Alcohol', '750ml', 27.99, 29.99, 19.50, 12, 4, 1, $BEVERAGE_SUPPLIER],

        // Soft Drinks & Energy
        ['Coca-Cola Classic', 'DRNK-COKE-20', '049000000443', 'Coca-Cola', 'Soft Drinks & Energy', '591ml', 2.49, 2.79, 1.20, 60, 18, 0, $BEVERAGE_SUPPLIER],
        ['Red Bull Energy Drink', 'DRNK-RB-12', '611269991000', 'Red Bull', 'Soft Drinks & Energy', '355ml', 3.99, 4.29, 2.35, 48, 12, 0, $BEVERAGE_SUPPLIER],
        ['Dasani Purified Water', 'DRNK-DAS-1L', '049000028287', 'Dasani', 'Soft Drinks & Energy', '1L', 1.99, 2.19, 0.85, 72, 24, 0, $BEVERAGE_SUPPLIER],

        // Snacks
        ['Lays Classic Potato Chips', 'SNCK-LAYS-LG', '028400090865', 'Lays', 'Snacks', '184g', 4.29, 4.79, 2.40, 40, 12, 0, $SNACK_SUPPLIER],
        ['Snickers Chocolate Bar', 'SNCK-SNK-BAR', '040000485285', 'Snickers', 'Snacks', '52g', 2.19, 2.39, 1.05, 90, 24, 0, $SNACK_SUPPLIER],
        ['Jack Links Original Beef Jerky', 'SNCK-JL-JERKY', '017082878809', 'Jack Links', 'Snacks', '92g', 7.49, 7.99, 4.60, 26, 8, 0, $SNACK_SUPPLIER],

        // Vapes & Tobacco
        ['Elf Bar BC5000 Blue Razz Ice', 'VAPE-ELF-BR', '682384210017', 'Elf Bar', 'Vapes & Tobacco', '5000 puffs', 19.99, 21.99, 12.00, 20, 6, 1, $SNACK_SUPPLIER],
        ['JUUL Virginia Tobacco Pods 4-Pack', 'VAPE-JUUL-VT4', '853340006086', 'JUUL', 'Vapes & Tobacco', '4 x 0.7ml', 23.99, 25.99, 15.50, 15, 5, 1, $SNACK_SUPPLIER],
        ['Marlboro Gold Pack', 'TOBC-MRB-GLD', '028200003201', 'Marlboro', 'Vapes & Tobacco', '20 ct', 11.49, 12.49, 8.20, 30, 10, 1, $SNACK_SUPPLIER],
    ];

    $productInsert = $pdo->prepare(
        'INSERT INTO products
            (name, sku, barcode, brand, category_id, bottle_size, price, mrp, cost_price, stock, low_stock_threshold, is_alcohol, supplier_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'
    );
    foreach ($products as $p) {
        [$name, $sku, $barcode, $brand, $category, $size, $price, $mrp, $cost, $stock, $threshold, $ageRestricted, $supplierId] = $p;
        $productInsert->execute([
            $name, $sku, $barcode, $brand, $categoryIds[$category], $size,
            $price, $mrp, $cost, $stock, $threshold, $ageRestricted, $supplierId,
        ]);
    }
}
