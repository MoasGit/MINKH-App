// src/views/watchlist/index.ts
import { getWatchlist, removeFromWatchlist } from '../../services/movieApi';
import { fetchMovieDetails, TMDB_IMAGE_BASE_URL } from '../../services/tmdbApi';
import { createWatchedModal } from '../../components/watchedModal';
import { createMovieDetailsModal } from '../../components/movieDetailsModal';
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
    const movies = await getWatchlist();
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
    const isWatched = movie.is_watched === 1;
    
    return `
      <div class="movie-card ${isWatched ? 'watched' : ''}" data-movie-id="${movie.id}">
        ${isWatched ? '<div class="watched-badge">✓ Watched</div>' : ''}
        <div class="movie-poster-wrapper" data-movie-id="${movie.id}" data-tmdb-id="${movie.tmdb_id}">
          <img 
            src="${movie.poster_path ? TMDB_IMAGE_BASE_URL + movie.poster_path : '/placeholder.jpg'}" 
            alt="${movie.title}"
            onerror="this.src='/placeholder.jpg'"
          />
          <div class="poster-overlay">
            <span class="view-details">👁️ View Details</span>
          </div>
        </div>
        <div class="movie-info">
          <h3>${movie.title}</h3>
          <div class="movie-meta">
            <span class="rating">⭐ ${movie.vote_average?.toFixed(1) || 'N/A'}</span>
            <span class="year">${movie.release_date?.substring(0, 4) || 'N/A'}</span>
          </div>
          
          ${isWatched ? `
            <div class="personal-rating-small">
              Your rating: ${renderStarsSmall(movie.personal_rating || 0)}
            </div>
          ` : ''}
          
          <p class="date-added">Added: ${new Date(movie.date_added).toLocaleDateString()}</p>
          <div class="button-group">
            ${!isWatched ? `
              <button class="btn-primary btn-watched" data-movie-id="${movie.id}">
                Mark as Watched
              </button>
            ` : ''}
            <button class="btn-remove" data-movie-id="${movie.id}">
              Remove from Watchlist
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // ⭐ NEW: Attach details handlers
  attachDetailsHandlers(container, movies);
  
  if (movies.some(m => m.is_watched === 0)) {
    attachWatchedHandlers(container, movies);
  }
  attachRemoveHandlers(container, movies);
}

function renderStarsSmall(rating: number): string {
  return Array.from({ length: 5 }, (_, i) => 
    i < rating ? '★' : '☆'
  ).join('');
}

// ⭐ NEW: Handle clicks to open movie details modal
function attachDetailsHandlers(container: HTMLElement, movies: DatabaseMovie[]) {
  const posterWrappers = container.querySelectorAll('.movie-poster-wrapper');
  
  posterWrappers.forEach(wrapper => {
    wrapper.addEventListener('click', async (e) => {
      e.stopPropagation();
      
      const tmdbId = parseInt((wrapper as HTMLElement).dataset.tmdbId || '0');
      const movie = movies.find(m => m.tmdb_id === tmdbId);
      if (!movie) return;
      
      const overlay = wrapper.querySelector('.poster-overlay') as HTMLElement;
      if (overlay) {
        overlay.innerHTML = '<span class="view-details">Loading...</span>';
      }
      
      try {
        const movieDetails = await fetchMovieDetails(movie.tmdb_id);
        
        const modal = createMovieDetailsModal(movie, movieDetails);
        document.body.appendChild(modal);
        
        setTimeout(() => modal.classList.add('show'), 10);
        
      } catch (error) {
        console.error('Failed to load movie details:', error);
        showNotification('Failed to load movie details', 'error');
      } finally {
        if (overlay) {
          overlay.innerHTML = '<span class="view-details">👁️ View Details</span>';
        }
      }
    });
  });
}

function attachWatchedHandlers(container: HTMLElement, movies: DatabaseMovie[]) {
  const watchedButtons = container.querySelectorAll('.btn-watched');
  
  watchedButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.target as HTMLButtonElement;
      const movieId = parseInt(btn.dataset.movieId || '0');
      
      const movie = movies.find(m => m.id === movieId);
      if (!movie) return;
      
      const modal = createWatchedModal(movie, (updatedMovie) => {
        updateMovieCard(container, updatedMovie);
        showNotification(`${movie.title} marked as watched!`);
      });
      
      document.body.appendChild(modal);
      
      setTimeout(() => modal.classList.add('show'), 10);
    });
  });
}

function updateMovieCard(container: HTMLElement, movie: DatabaseMovie) {
  const movieCard = container.querySelector(`.movie-card[data-movie-id="${movie.id}"]`);
  if (!movieCard) return;
  
  const isWatched = movie.is_watched === 1;
  
  if (isWatched) {
    movieCard.classList.add('watched');
  }
  
  movieCard.innerHTML = `
    ${isWatched ? '<div class="watched-badge">✓ Watched</div>' : ''}
    <div class="movie-poster-wrapper" data-movie-id="${movie.id}" data-tmdb-id="${movie.tmdb_id}">
      <img 
        src="${movie.poster_path ? TMDB_IMAGE_BASE_URL + movie.poster_path : '/placeholder.jpg'}" 
        alt="${movie.title}"
        onerror="this.src='/placeholder.jpg'"
      />
      <div class="poster-overlay">
        <span class="view-details">👁️ View Details</span>
      </div>
    </div>
    <div class="movie-info">
      <h3>${movie.title}</h3>
      <div class="movie-meta">
        <span class="rating">⭐ ${movie.vote_average?.toFixed(1) || 'N/A'}</span>
        <span class="year">${movie.release_date?.substring(0, 4) || 'N/A'}</span>
      </div>
      
      ${isWatched ? `
        <div class="personal-rating-small">
          Your rating: ${renderStarsSmall(movie.personal_rating || 0)}
        </div>
      ` : ''}
      
      <p class="date-added">Added: ${new Date(movie.date_added).toLocaleDateString()}</p>
      <div class="button-group">
        ${!isWatched ? `
          <button class="btn-primary btn-watched" data-movie-id="${movie.id}">
            Mark as Watched
          </button>
        ` : ''}
        <button class="btn-remove" data-movie-id="${movie.id}">
          Remove from Watchlist
        </button>
      </div>
    </div>
  `;
  
  // Re-attach handlers for this specific card
  const posterWrapper = movieCard.querySelector('.movie-poster-wrapper');
  if (posterWrapper) {
    posterWrapper.addEventListener('click', async (e) => {
      e.stopPropagation();
      
      const overlay = posterWrapper.querySelector('.poster-overlay') as HTMLElement;
      if (overlay) {
        overlay.innerHTML = '<span class="view-details">Loading...</span>';
      }
      
      try {
        const movieDetails = await fetchMovieDetails(movie.tmdb_id);
        const modal = createMovieDetailsModal(movie, movieDetails);
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
      } catch (error) {
        console.error('Failed to load movie details:', error);
        showNotification('Failed to load movie details', 'error');
      } finally {
        if (overlay) {
          overlay.innerHTML = '<span class="view-details">👁️ View Details</span>';
        }
      }
    });
  }
  
  const removeBtn = movieCard.querySelector('.btn-remove');
  if (removeBtn) {
    removeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const btn = e.target as HTMLButtonElement;
      
      if (!confirm(`Remove "${movie.title}" from watchlist?`)) return;
      
      btn.disabled = true;
      btn.textContent = 'Removing...';
      
      try {
        await removeFromWatchlist(movie.id);
        showNotification(`${movie.title} removed from watchlist`);
        movieCard.remove();
        
        const remainingCards = container.querySelectorAll('.movie-card');
        if (remainingCards.length === 0) {
          container.innerHTML = `
            <div class="empty-state">
              <p>Your watchlist is empty</p>
              <p>Browse movies and add them to your watchlist!</p>
              <a href="/" class="btn-primary">Browse Movies</a>
            </div>
          `;
        }
      } catch (error) {
        console.error('Failed to remove movie:', error);
        showNotification('Failed to remove movie', 'error');
        btn.disabled = false;
        btn.textContent = 'Remove from Watchlist';
      }
    });
  }
}

function attachRemoveHandlers(container: HTMLElement, movies: DatabaseMovie[]) {
  const removeButtons = container.querySelectorAll('.btn-remove');
  
  removeButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.stopPropagation();
      const btn = e.target as HTMLButtonElement;
      const movieId = parseInt(btn.dataset.movieId || '0');
      
      const movie = movies.find(m => m.id === movieId);
      if (!movie) return;
      
      if (!confirm(`Remove "${movie.title}" from watchlist?`)) return;
      
      btn.disabled = true;
      btn.textContent = 'Removing...';
      
      try {
        await removeFromWatchlist(movieId);
        showNotification(`${movie.title} removed from watchlist`);
        
        const movieCard = container.querySelector(`.movie-card[data-movie-id="${movieId}"]`);
        if (movieCard) {
          movieCard.remove();
        }
        
        const remainingCards = container.querySelectorAll('.movie-card');
        if (remainingCards.length === 0) {
          container.innerHTML = `
            <div class="empty-state">
              <p>Your watchlist is empty</p>
              <p>Browse movies and add them to your watchlist!</p>
              <a href="/" class="btn-primary">Browse Movies</a>
            </div>
          `;
        }
      } catch (error) {
        console.error('Failed to remove movie:', error);
        showNotification('Failed to remove movie', 'error');
        btn.disabled = false;
        btn.textContent = 'Remove from Watchlist';
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