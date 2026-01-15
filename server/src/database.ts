import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initiera databasen
const db = new Database(join(__dirname, '../database.db'));

// Slå på foreign keys
db.pragma('foreign_keys = ON');

// Skapa tabeller
const initDatabase = (): void => {
  // Movies-tabell (en databas per projekt, ingen användaruppdelning)
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
  console.log('✓ Databastabeller initierade');
};

// Initiera databasen vid import
initDatabase();

export default db;