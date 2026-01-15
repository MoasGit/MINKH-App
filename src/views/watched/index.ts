// src/views/watched/index.ts
import { getWatched, deleteMovie, toggleFavorite } from '../../services/movieApi';
import { fetchMovieDetails, TMDB_IMAGE_BASE_URL } from '../../services/tmdbApi';
import { createEditWatchedModal } from '../../components/editWatchedModal';
import { createMovieDetailsModal } from '../../components/movieDetailsModal';
import type { DatabaseMovie } from '../../types/movie';

type FilterType = 'all' | 'favorites' | 'highest-rated';

export default function watched(): HTMLElement {
  const container = document.createElement("div");
  container.className = "watched";

  const header = document.createElement("div");
  header.className = "search-section";
  header.innerHTML = `
    <h2>Watched Movies</h2>
    <div class="filter-buttons">
      <button class="filter-btn active" data-filter="all">All Watched</button>
      <button class="filter-btn" data-filter="favorites">⭐ Favorites</button>
      <button class="filter-btn" data-filter="highest-rated">📊 Highest Rated</button>
    </div>
  `;
  container.appendChild(header);

  const moviesContainer = document.createElement("div");
  moviesContainer.className = "movies-grid";
  moviesContainer.innerHTML = '<p class="loading">Loading watched movies...</p>';
  container.appendChild(moviesContainer);

  let allMovies: DatabaseMovie[] = [];
  let currentFilter: FilterType = 'all';

  loadWatched(moviesContainer).then(movies => {
    allMovies = movies;
  });

  const filterButtons = header.querySelectorAll('.filter-btn');
  filterButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const btn = e.target as HTMLButtonElement;
      const filter = btn.dataset.filter as FilterType;
      
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      currentFilter = filter;
      const filteredMovies = applyFilter(allMovies, filter);
      displayWatched(filteredMovies, moviesContainer, allMovies);
    });
  });

  return container;
}

function applyFilter(movies: DatabaseMovie[], filter: FilterType): DatabaseMovie[] {
  switch (filter) {
    case 'favorites':
      return movies.filter(m => m.is_favorite === 1);
    case 'highest-rated':
      return [...movies]
        .filter(m => m.personal_rating !== null)
        .sort((a, b) => (b.personal_rating || 0) - (a.personal_rating || 0));
    case 'all':
    default:
      return movies;
  }
}

async function loadWatched(container: HTMLElement): Promise<DatabaseMovie[]> {
  try {
    const movies = await getWatched();
    displayWatched(movies, container, movies);
    return movies;
  } catch (error) {
    console.error('Error loading watched movies:', error);
    container.innerHTML = '<p class="error">Failed to load watched movies.</p>';
    return [];
  }
}

function displayWatched(
  movies: DatabaseMovie[], 
  container: HTMLElement,
  allMovies: DatabaseMovie[]
) {
  if (movies.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No movies found</p>
        <p>Try a different filter or add more watched movies!</p>
        <a href="/watchlist" class="btn-primary">Go to Watchlist</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <p class="watched-count">${movies.length} movie${movies.length !== 1 ? 's' : ''} found</p>
  ` + movies.map(movie => {
    const isFavorite = movie.is_favorite === 1;
    
    return `
      <div class="movie-card">
        <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                data-movie-id="${movie.id}"
                title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
          ${isFavorite ? '★' : '☆'}
        </button>
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

  // ⭐ NEW: Attach details handlers
  attachDetailsHandlers(container, allMovies);
  attachFavoriteHandlers(container, allMovies);
  attachEditHandlers(container, allMovies);
  attachRemoveHandlers(container, allMovies);
}

function renderStars(rating: number): string {
  return Array.from({ length: 5 }, (_, i) => 
    i < rating 
      ? '<span class="star filled">★</span>' 
      : '<span class="star">★</span>'
  ).join('');
}

// ⭐ NEW: Handle clicks to open movie details modal
function attachDetailsHandlers(container: HTMLElement, allMovies: DatabaseMovie[]) {
  const posterWrappers = container.querySelectorAll('.movie-poster-wrapper');
  
  posterWrappers.forEach(wrapper => {
    wrapper.addEventListener('click', async (e) => {
      e.stopPropagation();
      
      const tmdbId = parseInt((wrapper as HTMLElement).dataset.tmdbId || '0');
      const movie = allMovies.find(m => m.tmdb_id === tmdbId);
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

function attachFavoriteHandlers(container: HTMLElement, allMovies: DatabaseMovie[]) {
  const favoriteButtons = container.querySelectorAll('.favorite-btn');
  
  favoriteButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.stopPropagation();
      const btn = e.target as HTMLButtonElement;
      const movieId = parseInt(btn.dataset.movieId || '0');
      
      const movie = allMovies.find(m => m.id === movieId);
      if (!movie) return;
      
      const isFavorite = movie.is_favorite === 1;
      const newFavoriteState = !isFavorite;
      
      btn.classList.toggle('active');
      btn.textContent = newFavoriteState ? '★' : '☆';
      btn.title = newFavoriteState ? 'Remove from favorites' : 'Add to favorites';
      btn.disabled = true;
      
      try {
        const updatedMovie = await toggleFavorite(movieId, newFavoriteState);
        
        const index = allMovies.findIndex(m => m.id === movieId);
        if (index !== -1) {
          allMovies[index] = updatedMovie;
        }
        
        showNotification(
          newFavoriteState 
            ? `${movie.title} added to favorites!` 
            : `${movie.title} removed from favorites`
        );
        
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
        
        btn.classList.toggle('active');
        btn.textContent = isFavorite ? '★' : '☆';
        btn.title = isFavorite ? 'Remove from favorites' : 'Add to favorites';
        
        showNotification('Failed to update favorite status', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  });
}

function attachEditHandlers(container: HTMLElement, allMovies: DatabaseMovie[]) {
  const editButtons = container.querySelectorAll('.btn-edit');
  
  editButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.target as HTMLButtonElement;
      const movieId = parseInt(btn.dataset.movieId || '0');
      
      const movie = allMovies.find(m => m.id === movieId);
      if (!movie) return;
      
      const modal = createEditWatchedModal(movie, () => {
        loadWatched(container).then(movies => {
          allMovies.length = 0;
          allMovies.push(...movies);
        });
      });
      
      document.body.appendChild(modal);
      setTimeout(() => modal.classList.add('show'), 10);
    });
  });
}

function attachRemoveHandlers(container: HTMLElement, allMovies: DatabaseMovie[]) {
  const removeButtons = container.querySelectorAll('.btn-remove');
  
  removeButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.stopPropagation();
      const btn = e.target as HTMLButtonElement;
      const movieId = parseInt(btn.dataset.movieId || '0');
      
      const movie = allMovies.find(m => m.id === movieId);
      if (!movie) return;
      
      if (!confirm(`Remove "${movie.title}" from watched movies? This cannot be undone.`)) {
        return;
      }
      
      btn.disabled = true;
      btn.textContent = 'Removing...';
      
      try {
        await deleteMovie(movieId);
        
        showNotification(`${movie.title} removed from watched`);
        
        const index = allMovies.findIndex(m => m.id === movieId);
        if (index !== -1) {
          allMovies.splice(index, 1);
        }
        
        loadWatched(container).then(movies => {
          allMovies.length = 0;
          allMovies.push(...movies);
        });
        
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