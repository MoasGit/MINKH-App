import { fetchTopMovies, fetchMovies, TMDB_IMAGE_BASE_URL } from '../../services/tmdbApi';
import type { TMDBMovie } from '../../types/movie';

export default function browse(): HTMLElement {
  const container = document.createElement("div");
  container.className = "browse";

  // Search section med input-fält
  const searchSection = document.createElement("div");
  searchSection.className = "search-section";
  searchSection.innerHTML = `
    <h2>Browse Movies</h2>
    <div class="search-box">
      <input 
        type="text" 
        id="movie-search" 
        placeholder="Search for a movie..." 
        class="search-input"
      />
      <button id="clear-search" class="clear-btn" style="display: none;">✕</button>
    </div>
  `;
  container.appendChild(searchSection);

  // Movies container
  const moviesContainer = document.createElement("div");
  moviesContainer.className = "movies-grid";
  moviesContainer.innerHTML = '<p>Loading movies...</p>';
  container.appendChild(moviesContainer);

  // Hämta populära filmer som standard
  loadMovies(moviesContainer);

  // Lägg till event listeners EFTER att elementen finns i DOM:en
  const searchInput = searchSection.querySelector('#movie-search') as HTMLInputElement;
  const clearButton = searchSection.querySelector('#clear-search') as HTMLButtonElement;

  // Lyssna på när användaren skriver
  searchInput.addEventListener('input', (e) => {
    const query = (e.target as HTMLInputElement).value.trim();
    
    // Visa/dölj clear-knappen
    if (query.length > 0) {
      clearButton.style.display = 'block';
    } else {
      clearButton.style.display = 'none';
    }

    // Sök när användaren skrivit minst 3 tecken
    if (query.length >= 3) {
      searchMovies(query, moviesContainer);
    } else if (query.length === 0) {
      // Om sökfältet är tomt, visa populära filmer
      loadMovies(moviesContainer);
    }
  });

  // Rensa sökning när man klickar på X
  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    clearButton.style.display = 'none';
    loadMovies(moviesContainer);
  });

  return container;
}

// Hämta populära filmer (default-läge)
async function loadMovies(container: HTMLElement) {
  try {
    container.innerHTML = '<p class="loading">Loading movies...</p>';
    const movies = await fetchTopMovies();
    displayMovies(movies, container, 'Top Rated Movies');
  } catch (error) {
    console.error('Error loading movies:', error);
    container.innerHTML = '<p class="error">Failed to load movies. Please try again later.</p>';
  }
}

// Sök efter filmer
async function searchMovies(query: string, container: HTMLElement) {
  try {
    container.innerHTML = '<p class="loading">Searching...</p>';
    const movies = await fetchMovies(query);
    displayMovies(movies, container, `Search results for "${query}"`);
  } catch (error) {
    console.error('Error searching movies:', error);
    container.innerHTML = '<p class="error">Failed to search. Please try again.</p>';
  }
}

// Visa filmer
function displayMovies(movies: TMDBMovie[], container: HTMLElement, title?: string) {
  if (movies.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <p>No movies found.</p>
        ${title?.includes('Search') ? '<p>Try a different search term.</p>' : ''}
      </div>
    `;
    return;
  }

  const titleHTML = title ? `<h3 class="results-title">${title}</h3>` : '';

  container.innerHTML = titleHTML + movies.map(movie => `
    <div class="movie-card">
      <img 
        src="${movie.poster_path ? TMDB_IMAGE_BASE_URL + movie.poster_path : '/placeholder.jpg'}" 
        alt="${movie.title}"
        onerror="this.src='/placeholder.jpg'"
      />
      <div class="movie-info">
        <h3>${movie.title}</h3>
        <div class="movie-meta">
          <span class="rating">⭐ ${movie.vote_average.toFixed(1)}</span>
          <span class="year">${movie.release_date?.substring(0, 4) || 'N/A'}</span>
        </div>
        <p class="overview">${movie.overview?.substring(0, 100) || 'No description available'}...</p>
        <button class="btn-watchlist" data-movie-id="${movie.id}">
          Add to Watchlist
        </button>
      </div>
    </div>
  `).join('');
}