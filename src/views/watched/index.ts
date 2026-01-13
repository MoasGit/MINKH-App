// src/views/watched/index.ts
import { getWatched, deleteMovie } from '../../services/movieApi';
import { TMDB_IMAGE_BASE_URL } from '../../services/tmdbApi';
import { createEditWatchedModal } from '../../components/editWatchedModal';
import type { DatabaseMovie } from '../../types/movie';

export default function watched(): HTMLElement {
  const container = document.createElement("div");
  container.className = "watched";

  const header = document.createElement("div");
  header.className = "search-section";
  header.innerHTML = `<h2>Watched Movies</h2>`;
  container.appendChild(header);

  const moviesContainer = document.createElement("div");
  moviesContainer.className = "movies-grid";
  moviesContainer.innerHTML = '<p class="loading">Loading watched movies...</p>';
  container.appendChild(moviesContainer);

  loadWatched(moviesContainer);

  return container;
}

async function loadWatched(container: HTMLElement) {
  try {
    const [movies] = await Promise.all([
      getWatched()
    ]);
    
    displayWatched(movies, container);
  } catch (error) {
    console.error('Error loading watched movies:', error);
    container.innerHTML = '<p class="error">Failed to load watched movies.</p>';
  }
}

function displayWatched(
  movies: DatabaseMovie[], 
  container: HTMLElement
) {
  if (movies.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>You haven't watched any movies yet</p>
        <p>Mark movies as watched from your watchlist!</p>
        <a href="/watchlist" class="btn-primary">Go to Watchlist</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <p class="watched-count">${movies.length} movie${movies.length !== 1 ? 's' : ''} watched</p>
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
          
        
          
          <div class="personal-rating">
            <strong>Your Rating:</strong>
            <div class="stars">
              ${renderStars(movie.personal_rating || 0)}
            </div>
          </div>
          
          ${movie.review 
            ? `<p class="review">"${movie.review}"</p>`
            : ''
          }
          
          <p class="date-watched">Watched: ${movie.date_watched ? new Date(movie.date_watched).toLocaleDateString() : 'N/A'}</p>
          
          <div class="button-group">
            <button class="btn-edit" data-movie-id="${movie.id}">
              ✏️ Edit
            </button>
            <button class="btn-remove" data-movie-id="${movie.id}">
              🗑️ Remove
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // ⭐ Attach handlers
  attachEditHandlers(container, movies);
  attachRemoveHandlers(container, movies);
}

function renderStars(rating: number): string {
  return Array.from({ length: 5 }, (_, i) => 
    i < rating 
      ? '<span class="star filled">★</span>' 
      : '<span class="star">★</span>'
  ).join('');
}

// ⭐ NY FUNKTION: Hantera Edit-knappar
function attachEditHandlers(container: HTMLElement, movies: DatabaseMovie[]) {
  const editButtons = container.querySelectorAll('.btn-edit');
  
  editButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const btn = e.target as HTMLButtonElement;
      const movieId = parseInt(btn.dataset.movieId || '0');
      
      const movie = movies.find(m => m.id === movieId);
      if (!movie) return;
      
      // Öppna edit modal
      const modal = createEditWatchedModal(movie, () => {
        // Callback när filmen uppdaterats
        loadWatched(container);
      });
      
      document.body.appendChild(modal);
      
      // Fade in animation
      setTimeout(() => modal.classList.add('show'), 10);
    });
  });
}

// ⭐ NY FUNKTION: Hantera Remove-knappar
function attachRemoveHandlers(container: HTMLElement, movies: DatabaseMovie[]) {
  const removeButtons = container.querySelectorAll('.btn-remove');
  
  removeButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const btn = e.target as HTMLButtonElement;
      const movieId = parseInt(btn.dataset.movieId || '0');
      
      const movie = movies.find(m => m.id === movieId);
      if (!movie) return;
      
      // Bekräfta borttagning
      if (!confirm(`Remove "${movie.title}" from watched movies? This cannot be undone.`)) {
        return;
      }
      
      btn.disabled = true;
      btn.textContent = 'Removing...';
      
      try {
        await deleteMovie(movieId);
        
        showNotification(`${movie.title} removed from watched`);
        
        // Reload watched list
        loadWatched(container);
        
      } catch (error) {
        console.error('Failed to remove movie:', error);
        showNotification('Failed to remove movie', 'error');
        btn.disabled = false;
        btn.textContent = '🗑️ Remove';
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