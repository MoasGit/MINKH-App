import express, { Request, Response } from 'express';
import db from '../database.js';

const router = express.Router();

interface Movie {
  id: number;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  overview: string | null;
  in_watchlist: number;
  is_watched: number;
  personal_rating: number | null;
  review: string | null;
  is_favorite: number;
  date_added: string;
  date_watched: string | null;
}

interface CreateMovieBody {
  tmdb_id: number;
  title: string;
  poster_path?: string | null;
  release_date?: string | null;
  vote_average?: number | null;
  overview?: string | null;
  in_watchlist?: boolean;
  is_watched?: boolean;
  personal_rating?: number | null;
  review?: string | null;
  is_favorite?: boolean;
  date_watched?: string | null;
}

interface UpdateMovieBody {
  in_watchlist?: boolean;
  is_watched?: boolean;
  personal_rating?: number | null;
  review?: string | null;
  is_favorite?: boolean;
  date_watched?: string | null;
}

interface StatsResponse {
  totalMovies: number;
  watchlistCount: number;
  watchedCount: number;
  favoritesCount: number;
  averageRating: number;
}

/**
 * GET /api/movies
 * Hämta alla filmer
 * Query params: ?view=watchlist|watched
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { view } = req.query as { view?: 'watchlist' | 'watched' };

    let query = 'SELECT * FROM movies WHERE 1=1';
    const params: unknown[] = [];

    // Filtrera på view om den skickas in
    if (view === 'watchlist') {
      query += ' AND in_watchlist = 1';
    } else if (view === 'watched') {
      query += ' AND is_watched = 1';
    }

    query += ' ORDER BY date_added DESC';

    const movies = db.prepare(query).all(...params) as Movie[];

    res.json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({
      error: 'Failed to fetch movies',
      message: (error as Error).message
    });
  }
});

/**
 * GET /api/movies/:id
 * Hämta en specifik film via ID
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const movie = db
      .prepare('SELECT * FROM movies WHERE id = ?')
      .get(id) as Movie | undefined;

    if (!movie) {
      return res.status(404).json({
        error: 'Movie not found',
        hint: 'Make sure the movie exists and belongs to your user'
      });
    }

    res.json(movie);
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({
      error: 'Failed to fetch movie',
      message: (error as Error).message
    });
  }
});

/**
 * POST /api/movies
 * Lägg till en ny film (i watchlist eller watched)
 */
router.post('/', (req: Request<unknown, unknown, CreateMovieBody>, res: Response) => {
  try {
    const {
      tmdb_id,
      title,
      poster_path,
      release_date,
      vote_average,
      overview,
      in_watchlist = true,
      is_watched = false,
      personal_rating,
      review,
      is_favorite,
      date_watched
    } = req.body;

    // Validering
    if (!tmdb_id || !title) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['tmdb_id', 'title'],
        hint: 'Make sure to include tmdb_id and title'
      });
    }

    // Om is_watched är true, validera personal_rating
    if (is_watched && personal_rating != null) {
      if (personal_rating < 1 || personal_rating > 5) {
        return res.status(400).json({
          error: 'Invalid personal_rating',
          hint: 'Personal rating must be between 1 and 5'
        });
      }
    }

    // Spara filmen i databasen
    const stmt = db.prepare(`
      INSERT INTO movies (
        tmdb_id, title, poster_path, release_date,
        vote_average, overview, in_watchlist, is_watched,
        personal_rating, review, is_favorite, date_watched
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      tmdb_id,
      title,
      poster_path || null,
      release_date || null,
      vote_average || null,
      overview || null,
      in_watchlist ? 1 : 0,
      is_watched ? 1 : 0,
      personal_rating ?? null,
      review ?? null,
      is_favorite ? 1 : 0,
      date_watched || null
    );

    // Hämta den skapade filmen
    const movie = db
      .prepare('SELECT * FROM movies WHERE id = ?')
      .get(result.lastInsertRowid) as Movie;

    res.status(201).json(movie);
  } catch (error) {
    // Hantera dubblett (UNIQUE constraint-överträdelser)
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        error: 'Movie already exists',
        hint: 'This movie is already in your collection. Try updating it instead.'
      });
    }

    console.error('Error creating movie:', error);
    res.status(500).json({
      error: 'Failed to create movie',
      message: (error as Error).message
    });
  }
});

/**
 * PUT /api/movies/:id
 * Uppdatera en film
 */
router.put('/:id', (req: Request<{ id: string }, unknown, UpdateMovieBody>, res: Response) => {
  try {
    const { id } = req.params;
    const {
      in_watchlist,
      is_watched,
      personal_rating,
      review,
      is_favorite,
      date_watched
    } = req.body;

    // Kolla om filmen finns
    const existingMovie = db
      .prepare('SELECT * FROM movies WHERE id = ?')
      .get(id) as Movie | undefined;

    if (!existingMovie) {
      return res.status(404).json({
        error: 'Movie not found',
        hint: 'Make sure the movie exists and belongs to your user'
      });
    }

    // Validera personal_rating om den skickas in
    if (personal_rating !== undefined && personal_rating !== null) {
      if (personal_rating < 1 || personal_rating > 5) {
        return res.status(400).json({
          error: 'Invalid personal_rating',
          hint: 'Personal rating must be between 1 and 5'
        });
      }
    }

    // Bygg upp en dynamisk UPDATE-query baserat på vilka fält som skickats in
    const updates: string[] = [];
    const params: unknown[] = [];

    if (in_watchlist !== undefined) {
      updates.push('in_watchlist = ?');
      params.push(in_watchlist ? 1 : 0);
    }
    if (is_watched !== undefined) {
      updates.push('is_watched = ?');
      params.push(is_watched ? 1 : 0);
    }
    if (personal_rating !== undefined) {
      updates.push('personal_rating = ?');
      params.push(personal_rating);
    }
    if (review !== undefined) {
      updates.push('review = ?');
      params.push(review);
    }
    if (is_favorite !== undefined) {
      updates.push('is_favorite = ?');
      params.push(is_favorite ? 1 : 0);
    }
    if (date_watched !== undefined) {
      updates.push('date_watched = ?');
      params.push(date_watched);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No fields to update',
        hint: 'Provide at least one field to update'
      });
    }

    // Lägg till parametrar till WHERE-villkoret
    params.push(id);

    // Uppdatera filmen
    const query = `
      UPDATE movies
      SET ${updates.join(', ')}
      WHERE id = ?
    `;

    db.prepare(query).run(...params);

    // Hämta uppdaterad film
    const movie = db
      .prepare('SELECT * FROM movies WHERE id = ?')
      .get(id) as Movie;

    res.json(movie);
  } catch (error) {
    console.error('Error updating movie:', error);
    res.status(500).json({
      error: 'Failed to update movie',
      message: (error as Error).message
    });
  }
});

/**
 * DELETE /api/movies/:id
 * Ta bort en film
 */
router.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;

    // Kolla om filmen finns
    const movie = db
      .prepare('SELECT * FROM movies WHERE id = ?')
      .get(id) as Movie | undefined;

    if (!movie) {
      return res.status(404).json({
        error: 'Movie not found',
        hint: 'Make sure the movie exists and belongs to your user'
      });
    }

    // Ta bort filmen
    db.prepare('DELETE FROM movies WHERE id = ?').run(id);

    res.json({
      message: 'Movie deleted successfully',
      movie
    });
  } catch (error) {
    console.error('Error deleting movie:', error);
    res.status(500).json({
      error: 'Failed to delete movie',
      message: (error as Error).message
    });
  }
});

/**
 * GET /api/movies/user/stats
 * Hämta statistik för alla sparade filmer
 */
router.get('/user/stats', (req: Request, res: Response) => {
  try {
    // Räkna totalt antal filmer
    const totalMovies = (db
      .prepare('SELECT COUNT(*) as count FROM movies')
      .get() as { count: number }).count;

    // Räkna antal watchlist-filmer
    const watchlistCount = (db
      .prepare('SELECT COUNT(*) as count FROM movies WHERE in_watchlist = 1')
      .get() as { count: number }).count;

    // Räkna antal watched-filmer
    const watchedCount = (db
      .prepare('SELECT COUNT(*) as count FROM movies WHERE is_watched = 1')
      .get() as { count: number }).count;

    // Räkna antal favoriter
    const favoritesCount = (db
      .prepare('SELECT COUNT(*) as count FROM movies WHERE is_favorite = 1')
      .get() as { count: number }).count;

    // Beräkna genomsnittligt personligt betyg
    const avgRow = db
      .prepare('SELECT AVG(personal_rating) as avg FROM movies WHERE personal_rating IS NOT NULL')
      .get() as { avg: number | null };

    const avgRating = avgRow?.avg ?? null;

    const response: StatsResponse = {
      totalMovies,
      watchlistCount,
      watchedCount,
      favoritesCount,
      averageRating: avgRating ? Number(avgRating.toFixed(2)) : 0
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: (error as Error).message
    });
  }
});

export default router;