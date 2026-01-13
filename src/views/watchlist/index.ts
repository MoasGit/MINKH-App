// src/views/watchlist/index.ts
import { getWatchlist, removeFromWatchlist } from '../../services/movieApi';
import { TMDB_IMAGE_BASE_URL } from '../../services/tmdbApi';
import { createWatchedModal } from '../../components/watchedModal';
import type { DatabaseMovie } from '../../types/movie';

export default function watchList(): HTMLElement {
  const container = document.createElement("div");
  container.className = "watchlist";

  const header = document.createElement("div");
  header.className = "search-section";
  header.innerHTML = `<h2>My Watchlist</h2>`;
  container.appendChild(header);

  const moviesContainer = document.createElement("div");
  moviesContainer.className = "movies-grid";
  moviesContainer.innerHTML = '<p class="loading">Loading watchlist...</p>';
  container.appendChild(moviesContainer);

  loadWatchlist(moviesContainer);

  return container;
}

async function loadWatchlist(container: HTMLElement) {
  try {
    const [movies] = await Promise.all([
      getWatchlist()
    ]);
    
    displayWatchlist(movies, container);
  } catch (error) {
    console.error('Error loading watchlist:', error);
    container.innerHTML = '<p class="error">Failed to load watchlist.</p>';
  }
}

function displayWatchlist(
  movies: DatabaseMovie[], 
  container: HTMLElement
) {
  if (movies.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Your watchlist is empty</p>
        <p>Browse movies and add them to your watchlist!</p>
        <a href="/" class="btn-primary">Browse Movies</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <p class="watchlist-count">${movies.length} movie${movies.length !== 1 ? 's' : ''} in your watchlist</p>
  ` + movies.map(movie => {
      [];
    
    return `
      <div class="movie-card">
        <img 
          src="${movie.poster_path ? TMDB_IMAGE_BASE_URL + movie.poster_path : '/placeholder.jpg'}" 
          alt="${movie.title}"
          onerror="this.src='/placeholder.jpg'"
        />
        <div class="movie-info">
          <h3>${movie.title}</h3>
          <div class="movie-meta">
            <span class="rating">⭐ ${movie.vote_average?.toFixed(1) || 'N/A'}</span>
            <span class="year">${movie.release_date?.substring(0, 4) || 'N/A'}</span>
          </div>
        
          
          <p class="date-added">Added: ${new Date(movie.date_added).toLocaleDateString()}</p>
          <div class="button-group">
            <button class="btn-primary btn-watched" data-movie-id="${movie.id}">
              Mark as Watched
            </button>
            <button class="btn-remove" data-movie-id="${movie.id}">
              Remove
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // ⭐ NYTT: Attach handlers
  attachWatchedHandlers(container, movies);
  attachRemoveHandlers(container, movies);
}

// ⭐ NY FUNKTION: Hantera "Mark as Watched"-knappar
function attachWatchedHandlers(container: HTMLElement, movies: DatabaseMovie[]) {
  const watchedButtons = container.querySelectorAll('.btn-watched');
  
  watchedButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const btn = e.target as HTMLButtonElement;
      const movieId = parseInt(btn.dataset.movieId || '0');
      
      const movie = movies.find(m => m.id === movieId);
      if (!movie) return;
      
      // Öppna modal
      const modal = createWatchedModal(movie, () => {
        // Callback när filmen markerats som watched
        loadWatchlist(container);
      });
      
      document.body.appendChild(modal);
      
      // Fade in animation
      setTimeout(() => modal.classList.add('show'), 10);
    });
  });
}

function attachRemoveHandlers(container: HTMLElement, movies: DatabaseMovie[]) {
  const removeButtons = container.querySelectorAll('.btn-remove');
  
  removeButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const btn = e.target as HTMLButtonElement;
      const movieId = parseInt(btn.dataset.movieId || '0');
      
      if (!confirm('Remove this movie from watchlist?')) return;
      
      try {
        await removeFromWatchlist(movieId);
        loadWatchlist(container);
        showNotification('Movie removed from watchlist');
      } catch (error) {
        console.error('Failed to remove movie:', error);
        showNotification('Failed to remove movie', 'error');
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