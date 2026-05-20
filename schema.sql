-- Umut Bağı Veritabanı Şeması (SQLite ve PostgreSQL ile Uyumlu)

-- Users (Kullanıcılar) Tablosu
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('disabled', 'donor')),
    is_verified BOOLEAN DEFAULT 0 NOT NULL,
    disability_summary TEXT
);

-- Listings (İlanlar/İhtiyaçlar) Tablosu
CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'matched', 'closed')),
    created_by INTEGER NOT NULL,
    matched_donor_id INTEGER,
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (matched_donor_id) REFERENCES users (id) ON DELETE SET NULL
);
