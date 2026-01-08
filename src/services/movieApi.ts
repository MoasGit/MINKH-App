// src/services/movieApi.ts
import type { DatabaseMovie, CreateMovieBody, TMDBMovie } from '../types/movie';

const API_BASE_URL = 'http://localhost:3000/api';

// Hämta watchlist
export async function getWatchlist(): Promise<DatabaseMovie[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/movies?status=watchlist`);

    if (!response.ok) {
      throw new Error('Failed to fetch watchlist');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    throw error;
  }
}

// Lägg till film i watchlist
export async function addToWatchlist(movie: TMDBMovie): Promise<DatabaseMovie> {
  try {
    const body: CreateMovieBody = {
      tmdb_id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      overview: movie.overview,
      status: 'watchlist'
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

// Ta bort från watchlist
export async function removeFromWatchlist(movieId: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/${movieId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to remove movie');
    }
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw error;
  }
}