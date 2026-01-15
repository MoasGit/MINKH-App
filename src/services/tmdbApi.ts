// Konfiguration
import type { TMDBMovie, TMDBMovieDetails } from '../types/movie';

const TMDB_API_KEY = '346ed5019388cb359ec595d99dc7de90';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Hämta populära filmer
export async function fetchTopMovies(): Promise<TMDBMovie[]> {
  const response = await fetch(
    `${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&language=en-US&page=1`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch popular movies');
  }
  
  const data = await response.json();
  console.log(data);
  
  return data.results;
}

// Sök efter filmer
export async function fetchMovies(query: string): Promise<TMDBMovie[]> {
  const response = await fetch(
    `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${query}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch movies');
  }
  
  const data = await response.json();
  return data.results;
}

// ⭐ NEW: Hämta fullständig filminformation (inkl. backdrop, runtime, genres)
export async function fetchMovieDetails(tmdbId: number): Promise<TMDBMovieDetails> {
  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch movie details');
  }
  
  const data = await response.json();
  return data;
}