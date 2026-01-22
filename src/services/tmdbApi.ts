import type { TMDBMovie, TMDBMovieDetails } from '../types/movie';

const TMDB_API_KEY = '346ed5019388cb359ec595d99dc7de90';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Hjälpfunktion för att hämta filmer
async function fetchMovieList(endpoint: string, params: string = ''): Promise<TMDBMovie[]> {
  const response = await fetch(
    `${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&language=en-US&page=1${params}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch from ${endpoint}`);
  }
  
  const data = await response.json();
  return data.results;
}

// Populära filmer
export async function fetchPopular(): Promise<TMDBMovie[]> {
  return fetchMovieList('/movie/popular');
}

// Top rated
export async function fetchTopRated(): Promise<TMDBMovie[]> {
  return fetchMovieList('/movie/top_rated');
}

// ⭐ NYTT: Discover med avancerad filtrering
export interface DiscoverFilters {
  genreId?: number;
  year?: number;
  minRating?: number;
  sortBy?: 'popularity.desc' | 'vote_average.desc' | 'release_date.desc';
}

export async function fetchDiscover(filters: DiscoverFilters = {}): Promise<TMDBMovie[]> {
  let params = '';
  
  if (filters.genreId) {
    params += `&with_genres=${filters.genreId}`;
  }
  
  if (filters.year) {
    params += `&primary_release_year=${filters.year}`;
  }
  
  if (filters.minRating) {
    params += `&vote_average.gte=${filters.minRating}`;
  }
  
  if (filters.sortBy) {
    params += `&sort_by=${filters.sortBy}`;
  } else {
    params += '&sort_by=popularity.desc';
  }
  
  return fetchMovieList('/discover/movie', params);
}

// Hämta genrer
export async function fetchGenres(): Promise<Array<{id: number, name: string}>> {
  const response = await fetch(
    `${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch genres');
  }
  
  const data = await response.json();
  return data.genres;
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

// Hämta fullständig filminformation
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

// Bakåtkompatibilitet
export async function fetchTopMovies(): Promise<TMDBMovie[]> {
  return fetchPopular();
}