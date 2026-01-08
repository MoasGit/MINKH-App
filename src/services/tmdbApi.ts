// Konfiguration

const TMDB_API_KEY = '346ed5019388cb359ec595d99dc7de90';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
//const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export async function fetchMovies(query: string) {
  const response = await fetch(
    `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${query}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch movies');
  }
  
  const data = await response.json();
  return data.results;
}