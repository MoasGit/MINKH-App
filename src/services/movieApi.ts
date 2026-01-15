// src/services/movieApi.ts
import type { DatabaseMovie, CreateMovieBody, TMDBMovie } from '../types/movie';

const API_BASE_URL = 'http://localhost:3000/api';

// ⭐ NEW: Helper to get all movies (for checking existence)
async function getAllMovies(): Promise<DatabaseMovie[]> {
  const response = await fetch(`${API_BASE_URL}/movies`);
  if (!response.ok) {
    throw new Error('Failed to fetch movies');
  }
  return await response.json();
}

// ⭐ NEW: Helper to find existing movie by tmdb_id
async function findExistingMovie(tmdbId: number): Promise<DatabaseMovie | null> {
  const allMovies = await getAllMovies();
  return allMovies.find(m => m.tmdb_id === tmdbId) || null;
}

// Hämta watchlist
export async function getWatchlist(): Promise<DatabaseMovie[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/movies?view=watchlist`);

    if (!response.ok) {
      throw new Error('Failed to fetch watchlist');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    throw error;
  }
}

// ⭐ UPDATED: Lägg till film i watchlist (check first, then insert or update)
export async function addToWatchlist(movie: TMDBMovie): Promise<DatabaseMovie> {
  try {
    // Check if movie already exists
    const existingMovie = await findExistingMovie(movie.id);
    
    if (existingMovie) {
      // Movie exists, just update it to be in watchlist
      console.log('Movie exists, updating to add to watchlist...');
      const response = await fetch(`${API_BASE_URL}/movies/${existingMovie.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          in_watchlist: true
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update movie');
      }
      
      return await response.json();
    }
    
    // Movie doesn't exist, create it
    const body: CreateMovieBody = {
      tmdb_id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      overview: movie.overview,
      in_watchlist: true,
      is_watched: false
    };

    const response = await fetch(`${API_BASE_URL}/movies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add movie');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    throw error;
  }
}

// Ta bort från watchlist (men behåll i watched om den är watched)
export async function removeFromWatchlist(movieId: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/${movieId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        in_watchlist: false
      })
    });

    if (!response.ok) {
      throw new Error('Failed to remove from watchlist');
    }
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw error;
  }
}

// Markera film som watched (BEHÅLLER i watchlist)
export async function markAsWatched(
  movieId: number,
  rating: number,
  review?: string
): Promise<DatabaseMovie> {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/${movieId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        is_watched: true,
        in_watchlist: true,
        personal_rating: rating,
        review: review || null,
        date_watched: new Date().toISOString().split('T')[0]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark as watched');
    }

    return await response.json();
  } catch (error) {
    console.error('Error marking as watched:', error);
    throw error;
  }
}

// Hämta watched movies
export async function getWatched(): Promise<DatabaseMovie[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/movies?view=watched`);

    if (!response.ok) {
      throw new Error('Failed to fetch watched movies');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching watched movies:', error);
    throw error;
  }
}

// ⭐ UPDATED: Add movie directly as watched (check first, then insert or update)
export async function addAsWatched(
  movie: TMDBMovie,
  rating: number,
  review?: string
): Promise<DatabaseMovie> {
  try {
    // Check if movie already exists
    const existingMovie = await findExistingMovie(movie.id);
    
    if (existingMovie) {
      // Movie exists, update it to be watched
      console.log('Movie exists, updating to mark as watched...');
      const response = await fetch(`${API_BASE_URL}/movies/${existingMovie.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_watched: true,
          in_watchlist: existingMovie.in_watchlist === 1, // Keep current watchlist status
          personal_rating: rating,
          review: review || null,
          date_watched: new Date().toISOString().split('T')[0]
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update movie');
      }
      
      return await response.json();
    }
    
    // Movie doesn't exist, create it as watched
    const body: CreateMovieBody = {
      tmdb_id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      overview: movie.overview,
      in_watchlist: false,
      is_watched: true,
      personal_rating: rating,
      review: review || null,
      date_watched: new Date().toISOString().split('T')[0]
    };

    const response = await fetch(`${API_BASE_URL}/movies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add movie');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding as watched:', error);
    throw error;
  }
}

// Uppdatera watched movie (rating/review)
export async function updateWatched(
  movieId: number,
  rating: number,
  review?: string
): Promise<DatabaseMovie> {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/${movieId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personal_rating: rating,
        review: review || null
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update movie');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating movie:', error);
    throw error;
  }
}

// ⭐ NEW: Toggle favorite status
export async function toggleFavorite(
  movieId: number,
  isFavorite: boolean
): Promise<DatabaseMovie> {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/${movieId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        is_favorite: isFavorite
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to toggle favorite');
    }

    return await response.json();
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
}

// Ta bort helt från databasen
export async function deleteMovie(movieId: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/${movieId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete movie');
    }
  } catch (error) {
    console.error('Error deleting movie:', error);
    throw error;
  }
}