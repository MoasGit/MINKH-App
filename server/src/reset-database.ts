import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { unlinkSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '../database.db');

console.log('🗑️  Återställer databasen...');

// Ta bort databasen om filen finns
if (existsSync(dbPath)) {
  unlinkSync(dbPath);
  console.log('✓ Tog bort befintlig databas');
}

// Skapa ny databas
const db = new Database(dbPath);

// Slå på foreign keys
db.pragma('foreign_keys = ON');

// Skapa tabeller
const createMoviesTable = `
  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tmdb_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    poster_path TEXT,
    release_date TEXT,
    vote_average REAL,
    overview TEXT,
    in_watchlist INTEGER DEFAULT 1,
    is_watched INTEGER DEFAULT 0,
    personal_rating INTEGER CHECK(personal_rating BETWEEN 1 AND 5),
    review TEXT,
    is_favorite INTEGER DEFAULT 0,
    date_added TEXT DEFAULT (datetime('now')),
    date_watched TEXT,
    UNIQUE(tmdb_id)
  )
`;

db.exec(createMoviesTable);

console.log('✓ Skapade nya databastabeller');
console.log('');
console.log('✅ Databasåterställning klar!');
console.log('   Du kan nu starta servern med: npm run dev');

db.close();