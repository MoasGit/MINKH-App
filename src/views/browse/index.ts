import { fetchTopMovies, fetchMovies, TMDB_IMAGE_BASE_URL } from '../../services/tmdbApi';
import { addToWatchlist, getWatchlist } from '../../services/movieApi';
import type { TMDBMovie } from '../../types/movie';

export default function browse(): HTMLElement {
  const container = document.createElement("div");
  container.className = "browse";

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

  const moviesContainer = document.createElement("div");
  moviesContainer.className = "movies-grid";
  moviesContainer.innerHTML = '<p>Loading movies...</p>';
  container.appendChild(moviesContainer);

  loadMovies(moviesContainer);

  const searchInput = searchSection.querySelector('#movie-search') as HTMLInputElement;
  const clearButton = searchSection.querySelector('#clear-search') as HTMLButtonElement;

  searchInput.addEventListener('input', (e) => {
    const query = (e.target as HTMLInputElement).value.trim();
    
    if (query.length > 0) {
      clearButton.style.display = 'block';
    } else {
      clearButton.style.display = 'none';
    }

    if (query.length >= 3) {
      searchMovies(query, moviesContainer);
    } else if (query.length === 0) {
      loadMovies(moviesContainer);
    }
  });

  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    clearButton.style.display = 'none';
    loadMovies(moviesContainer);
  });

  return container;
}

async function loadMovies(container: HTMLElement) {
  try {
    container.innerHTML = '<p class="loading">Loading movies...</p>';
    
    // ⭐ NYTT: Hämta båda samtidigt
    const [movies, watchlist] = await Promise.all([
      fetchTopMovies(),
      getWatchlist()
    ]);
    
    displayMovies(movies, container, 'Top Rated Movies', watchlist);
  } catch (error) {
    console.error('Error loading movies:', error);
    container.innerHTML = '<p class="error">Failed to load movies. Please try again later.</p>';
  }
}

async function searchMovies(query: string, container: HTMLElement) {
  try {
    container.innerHTML = '<p class="loading">Searching...</p>';
    
    // ⭐ NYTT: Hämta båda samtidigt
    const [movies, watchlist] = await Promise.all([
      fetchMovies(query),
      getWatchlist()
    ]);
    
    displayMovies(movies, container, `Search results for "${query}"`, watchlist);
  } catch (error) {
    console.error('Error searching movies:', error);
    container.innerHTML = '<p class="error">Failed to search. Please try again.</p>';
  }
}

// ⭐ ÄNDRING: Lägg till watchlist-parameter
function displayMovies(
  movies: TMDBMovie[], 
  container: HTMLElement, 
  title?: string,
  watchlist: DatabaseMovie[] = []
) {
  if (movies.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <p>No movies found.</p>
        ${title?.includes('Search') ? '<p>Try a different search term.</p>' : ''}
      </div>
    `;
    return;
  }

  // ⭐ NYTT: Skapa en Set för snabb lookup
  const watchlistIds = new Set(watchlist.map(m => m.tmdb_id));

  const titleHTML = title ? `<h3 class="results-title">${title}</h3>` : '';

  container.innerHTML = titleHTML + movies.map(movie => {
    // ⭐ NYTT: Kolla om filmen redan finns i watchlist
    const inWatchlist = watchlistIds.has(movie.id);
    
    return `
      <div class="movie-card" data-movie-id="${movie.id}">
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
          
          ${inWatchlist 
            ? '<button class="btn-watchlist added" disabled>✓ In Watchlist</button>'
            : '<button class="btn-watchlist" data-movie-id="' + movie.id + '">Add to Watchlist</button>'
          }
        </div>
      </div>
    `;
  }).join('');

  // Bara lägg till handlers på knappar som INTE är disabled
  attachWatchlistHandlers(container, movies);
}

function attachWatchlistHandlers(container: HTMLElement, movies: TMDBMovie[]) {
  // ⭐ ÄNDRING: Bara välj knappar som INTE är disabled
  const buttons = container.querySelectorAll('.btn-watchlist:not(.added)');
  
  buttons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const btn = e.target as HTMLButtonElement;
      const movieId = parseInt(btn.dataset.movieId || '0');
      
      const movie = movies.find(m => m.id === movieId);
      if (!movie) return;

      btn.disabled = true;
      btn.textContent = 'Adding...';
      
      try {
        await addToWatchlist(movie);
        
        // ⭐ Permanent disabled state
        btn.textContent = '✓ In Watchlist';
        btn.classList.add('added');
        
        showNotification(`${movie.title} added to watchlist!`);
        
      } catch (error) {
        console.error('Failed to add movie:', error);
        const errorMessage = (error as Error).message;
        
        if (errorMessage.includes('already exists')) {
          btn.textContent = '✓ In Watchlist';
          btn.classList.add('added');
          showNotification(`${movie.title} is already in your watchlist`);
        } else {
          btn.textContent = 'Failed!';
          btn.classList.add('error');
          showNotification('Failed to add movie. Try again.', 'error');
          
          setTimeout(() => {
            btn.textContent = 'Add to Watchlist';
            btn.disabled = false;
            btn.classList.remove('error');
          }, 2000);
        }
      }
    });
  });
}

function showNotification(message: string, type: 'success' | 'error' = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}