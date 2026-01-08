import { fetchPopularMovies, TMDB_IMAGE_BASE_URL } from '../../services/tmdbApi';
import type { TMDBMovie } from '../../types/movie';

export default function browse(): HTMLElement {
  const container = document.createElement("div");
  container.className = "browse";

  // Header section
  const searchSection = document.createElement("div");
  searchSection.className = "search-section";
  searchSection.innerHTML = `
    <h2>Browse Movies</h2>
  `;
  container.appendChild(searchSection);

  // Movies container
  const moviesContainer = document.createElement("div");
  moviesContainer.className = "movies-grid";
  moviesContainer.innerHTML = '<p>Loading movies...</p>';
  container.appendChild(moviesContainer);

  // Hämta och visa filmer
  loadMovies(moviesContainer);

  return container;
}

async function loadMovies(container: HTMLElement) {
  try {
    const movies = await fetchPopularMovies();
    displayMovies(movies, container);
  } catch (error) {
    console.error('Error loading movies:', error);
    container.innerHTML = '<p>Failed to load movies. Please try again later.</p>';
  }
}

function displayMovies(movies: TMDBMovie[], container: HTMLElement) {
  if (movies.length === 0) {
    container.innerHTML = '<p>No movies found.</p>';
    return;
  }

  container.innerHTML = movies.map(movie => `
    <div class="movie-card">
      <img 
        src="${movie.poster_path ? TMDB_IMAGE_BASE_URL + movie.poster_path : '/placeholder.jpg'}" 
        alt="${movie.title}"
      />
      <h3>${movie.title}</h3>
      <p>⭐ ${movie.vote_average.toFixed(1)}</p>
      <p>${movie.release_date?.substring(0, 4) || 'N/A'}</p>
      <button class="btn-watchlist">Add to Watchlist</button>
    </div>
  `).join('');
}