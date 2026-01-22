import {
  fetchPopular,
  fetchTopRated,
  fetchDiscover,
  fetchGenres,
  fetchMovies,
  fetchMovieDetails,
  TMDB_IMAGE_BASE_URL,
  type DiscoverFilters,
} from "../../services/tmdbApi";
import {
  addToWatchlist,
  getWatchlist,
  getWatched,
} from "../../services/movieApi";
import { createWatchedModal } from "../../components/watchedModal";
import { createMovieDetailsModal } from "../../components/movieDetailsModal";
import type { TMDBMovie, DatabaseMovie } from "../../types/movie";

type CategoryType = 'popular' | 'top-rated' | 'discover';

let visibleMovieCount = 12;
let currentCategory: CategoryType = 'popular';
let currentFilters: DiscoverFilters = {};
let genres: Array<{id: number, name: string}> = [];

export default function browse(): HTMLElement {
  const container = document.createElement("div");
  container.className = "browse";

  const searchSection = document.createElement("div");
  searchSection.className = "search-section";
  searchSection.innerHTML = `
    <h2>Browse Movies</h2>
    
    <div class="category-filters">
      <button class="category-btn active" data-category="popular">🔥 Popular</button>
      <button class="category-btn" data-category="top-rated">⭐ Top Rated</button>
      <button class="category-btn" data-category="discover">🔍 Discover</button>
    </div>
    
    <div class="discover-filters" style="display: none;">
      <div class="filter-row">
        <div class="filter-group">
          <label for="genre-filter">Genre</label>
          <select id="genre-filter">
            <option value="">All Genres</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="year-filter">Year</label>
          <select id="year-filter">
            <option value="">All Years</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="rating-filter">Min Rating</label>
          <select id="rating-filter">
            <option value="">Any Rating</option>
            <option value="7">7+ ⭐</option>
            <option value="8">8+ ⭐⭐</option>
            <option value="9">9+ ⭐⭐⭐</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="sort-filter">Sort By</label>
          <select id="sort-filter">
            <option value="popularity.desc">Most Popular</option>
            <option value="vote_average.desc">Highest Rated</option>
            <option value="release_date.desc">Newest First</option>
          </select>
        </div>
        
        <button id="apply-filters" class="apply-filters-btn">Apply Filters</button>
        <button id="reset-filters" class="reset-filters-btn">Reset</button>
      </div>
    </div>
    
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
  moviesContainer.innerHTML = "<p>Loading movies...</p>";
  container.appendChild(moviesContainer);

  // Load genres first
  loadGenres(searchSection).then(() => {
    loadMoviesByCategory(currentCategory, moviesContainer);
  });

  // Category filter buttons
  const categoryButtons = searchSection.querySelectorAll('.category-btn');
  const discoverFiltersPanel = searchSection.querySelector('.discover-filters') as HTMLElement;
  
  categoryButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const btn = e.target as HTMLButtonElement;
      const category = btn.dataset.category as CategoryType;
      
      // Clear search when changing category
      const searchInput = searchSection.querySelector('#movie-search') as HTMLInputElement;
      searchInput.value = '';
      const clearButton = searchSection.querySelector('#clear-search') as HTMLButtonElement;
      clearButton.style.display = 'none';
      
      // Update active state
      categoryButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Show/hide discover filters
      if (category === 'discover') {
        discoverFiltersPanel.style.display = 'block';
      } else {
        discoverFiltersPanel.style.display = 'none';
      }
      
      // Load new category
      currentCategory = category;
      loadMoviesByCategory(category, moviesContainer);
    });
  });

  // Discover filters
  const applyFiltersBtn = searchSection.querySelector('#apply-filters') as HTMLButtonElement;
  const resetFiltersBtn = searchSection.querySelector('#reset-filters') as HTMLButtonElement;
  
  applyFiltersBtn.addEventListener('click', () => {
    const genreSelect = searchSection.querySelector('#genre-filter') as HTMLSelectElement;
    const yearSelect = searchSection.querySelector('#year-filter') as HTMLSelectElement;
    const ratingSelect = searchSection.querySelector('#rating-filter') as HTMLSelectElement;
    const sortSelect = searchSection.querySelector('#sort-filter') as HTMLSelectElement;
    
    currentFilters = {
      genreId: genreSelect.value ? parseInt(genreSelect.value) : undefined,
      year: yearSelect.value ? parseInt(yearSelect.value) : undefined,
      minRating: ratingSelect.value ? parseFloat(ratingSelect.value) : undefined,
      sortBy: sortSelect.value as DiscoverFilters['sortBy'],
    };
    
    loadDiscoverMovies(moviesContainer);
  });
  
  resetFiltersBtn.addEventListener('click', () => {
    const genreSelect = searchSection.querySelector('#genre-filter') as HTMLSelectElement;
    const yearSelect = searchSection.querySelector('#year-filter') as HTMLSelectElement;
    const ratingSelect = searchSection.querySelector('#rating-filter') as HTMLSelectElement;
    const sortSelect = searchSection.querySelector('#sort-filter') as HTMLSelectElement;
    
    genreSelect.value = '';
    yearSelect.value = '';
    ratingSelect.value = '';
    sortSelect.value = 'popularity.desc';
    
    currentFilters = {};
    loadDiscoverMovies(moviesContainer);
  });

  // Search functionality
  const searchInput = searchSection.querySelector("#movie-search") as HTMLInputElement;
  const clearButton = searchSection.querySelector("#clear-search") as HTMLButtonElement;

  searchInput.addEventListener("input", (e) => {
    const query = (e.target as HTMLInputElement).value.trim();

    if (query.length > 0) {
      clearButton.style.display = "block";
    } else {
      clearButton.style.display = "none";
    }

    if (query.length >= 3) {
      searchMovies(query, moviesContainer);
    } else if (query.length === 0) {
      loadMoviesByCategory(currentCategory, moviesContainer);
    }
  });

  clearButton.addEventListener("click", () => {
    searchInput.value = "";
    clearButton.style.display = "none";
    loadMoviesByCategory(currentCategory, moviesContainer);
  });

  return container;
}

async function loadGenres(searchSection: HTMLElement) {
  try {
    genres = await fetchGenres();
    
    const genreSelect = searchSection.querySelector('#genre-filter') as HTMLSelectElement;
    genres.forEach(genre => {
      const option = document.createElement('option');
      option.value = genre.id.toString();
      option.textContent = genre.name;
      genreSelect.appendChild(option);
    });
    
    // Populate years (last 30 years)
    const yearSelect = searchSection.querySelector('#year-filter') as HTMLSelectElement;
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 30; year--) {
      const option = document.createElement('option');
      option.value = year.toString();
      option.textContent = year.toString();
      yearSelect.appendChild(option);
    }
  } catch (error) {
    console.error('Error loading genres:', error);
  }
}

async function loadMoviesByCategory(category: CategoryType, container: HTMLElement) {
  visibleMovieCount = 12;
  try {
    container.innerHTML = '<p class="loading">Loading movies...</p>';

    let movies: TMDBMovie[];
    let categoryTitle: string;
    
    switch (category) {
      case 'top-rated':
        movies = await fetchTopRated();
        categoryTitle = '⭐ Top Rated Movies';
        break;
      case 'discover':
        movies = await fetchDiscover(currentFilters);
        categoryTitle = '🔍 Discover Movies';
        break;
      case 'popular':
      default:
        movies = await fetchPopular();
        categoryTitle = '🔥 Popular Movies';
        break;
    }

    const [watchlist, watched] = await Promise.all([
      getWatchlist(),
      getWatched(),
    ]);

    displayMovies(movies, container, categoryTitle, watchlist, watched);
  } catch (error) {
    console.error("Error loading movies:", error);
    container.innerHTML =
      '<p class="error">Failed to load movies. Please try again later.</p>';
  }
}

async function loadDiscoverMovies(container: HTMLElement) {
  visibleMovieCount = 12;
  try {
    container.innerHTML = '<p class="loading">Applying filters...</p>';

    const movies = await fetchDiscover(currentFilters);
    const [watchlist, watched] = await Promise.all([
      getWatchlist(),
      getWatched(),
    ]);

    displayMovies(movies, container, '🔍 Discover Movies', watchlist, watched);
  } catch (error) {
    console.error("Error loading discover movies:", error);
    container.innerHTML =
      '<p class="error">Failed to load movies. Please try again later.</p>';
  }
}

async function searchMovies(query: string, container: HTMLElement) {
  visibleMovieCount = 12;
  try {
    container.innerHTML = '<p class="loading">Searching...</p>';

    const [movies, watchlist, watched] = await Promise.all([
      fetchMovies(query),
      getWatchlist(),
      getWatched(),
    ]);

    displayMovies(
      movies,
      container,
      `🔍 Search results for "${query}"`,
      watchlist,
      watched,
    );
  } catch (error) {
    console.error("Error searching movies:", error);
    container.innerHTML =
      '<p class="error">Failed to search. Please try again.</p>';
  }
}

function displayMovies(
  movies: TMDBMovie[],
  container: HTMLElement,
  title?: string,
  watchlist: DatabaseMovie[] = [],
  watched: DatabaseMovie[] = [],
) {
  if (movies.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <p>No movies found.</p>
        ${title?.includes("Search") ? "<p>Try a different search term.</p>" : ""}
        ${title?.includes("Discover") ? "<p>Try adjusting your filters.</p>" : ""}
      </div>
    `;
    return;
  }

  const watchlistIds = new Set(watchlist.map((m) => m.tmdb_id));
  const watchedIds = new Set(watched.map((m) => m.tmdb_id));

  const moviesToShow = movies.slice(0, visibleMovieCount);
  const hasMore = visibleMovieCount < movies.length;
  const remaining = movies.length - visibleMovieCount;

  container.innerHTML = moviesToShow
    .map((movie) => {
      const inWatchlist = watchlistIds.has(movie.id);
      const isWatched = watchedIds.has(movie.id);

      return `
      <div class="movie-card ${isWatched ? 'watched' : ''}" data-tmdb-id="${movie.id}">
        <div class="movie-poster-wrapper" data-movie-id="${movie.id}">
          <img 
            src="${movie.poster_path ? TMDB_IMAGE_BASE_URL + movie.poster_path : "/placeholder.png"}" 
            alt="${movie.title}"
            onerror="this.src='/placeholder.png'"
          />
          <div class="poster-overlay"></div>
        </div>
        
        <div class="movie-info">
          <h3>${movie.title}</h3>
          <div class="movie-meta">
            <span class="year">${movie.release_date?.substring(0, 4) || "N/A"}</span>
            <span class="rating">TMDB ★ ${movie.vote_average.toFixed(1)}</span>
          </div>
          
          <div class="button-group">
            ${
              inWatchlist
                ? '<button class="btn-watchlist added" disabled>✓ In Watchlist</button>'
                : '<button class="btn-watchlist" data-movie-id="' +
                  movie.id +
                  '">Add to Watchlist</button>'
            }
            ${
              isWatched
                ? '<button class="btn-watched-browse added" disabled>✓ Watched</button>'
                : '<button class="btn-watched-browse" data-movie-id="' +
                  movie.id +
                  '">Mark as Watched</button>'
            }
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  if (hasMore) {
    const loadMoreBtn = document.createElement("div");
    loadMoreBtn.className = "load-more-container";
    loadMoreBtn.innerHTML = `
      <button id="load-more-btn" class="load-more-button">
        Load more (${remaining})
      </button>
    `;
    container.appendChild(loadMoreBtn);

    const btn = loadMoreBtn.querySelector("#load-more-btn");
    btn?.addEventListener("click", () => {
      visibleMovieCount += 12;
      if (visibleMovieCount > movies.length) {
        visibleMovieCount = movies.length;
      }
      displayMovies(movies, container, title, watchlist, watched);
    });
  }

  attachDetailsHandlers(container, moviesToShow);
  attachWatchlistHandlers(container, moviesToShow);
  attachWatchedHandlers(container, moviesToShow);
}

// ⭐ Keep all your existing attachment functions exactly as they are:
// attachDetailsHandlers, attachWatchlistHandlers, attachWatchedHandlers, showNotification

function attachDetailsHandlers(container: HTMLElement, movies: TMDBMovie[]) {
  const posterWrappers = container.querySelectorAll(".movie-poster-wrapper");

  posterWrappers.forEach((wrapper) => {
    wrapper.addEventListener("click", async (e) => {
      e.stopPropagation();

      const movieId = parseInt((wrapper as HTMLElement).dataset.movieId || "0");
      const movie = movies.find((m) => m.id === movieId);
      if (!movie) return;

      const overlay = wrapper.querySelector(".poster-overlay") as HTMLElement;
      if (overlay) {
        overlay.innerHTML = "";
      }

      try {
        const movieDetails = await fetchMovieDetails(movie.id);
        const modal = createMovieDetailsModal(movie, movieDetails);
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add("show"), 10);
      } catch (error) {
        console.error("Failed to load movie details:", error);
        showNotification("Failed to load movie details", "error");
      } finally {
        if (overlay) {
          overlay.innerHTML = "";
        }
      }
    });
  });
}

function attachWatchlistHandlers(container: HTMLElement, movies: TMDBMovie[]) {
  const buttons = container.querySelectorAll(".btn-watchlist:not(.added)");

  buttons.forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.stopPropagation();
      const btn = e.target as HTMLButtonElement;
      const movieId = parseInt(btn.dataset.movieId || "0");

      const movie = movies.find((m) => m.id === movieId);
      if (!movie) return;

      btn.disabled = true;
      btn.textContent = "Adding...";

      try {
        await addToWatchlist(movie);
        btn.textContent = "✓ In Watchlist";
        btn.classList.add("added");
        showNotification(`${movie.title} added to watchlist!`);
      } catch (error) {
        console.error("Failed to add movie:", error);
        btn.textContent = "Failed!";
        btn.classList.add("error");
        showNotification("Failed to add movie. Try again.", "error");

        setTimeout(() => {
          btn.textContent = "Add to Watchlist";
          btn.disabled = false;
          btn.classList.remove("error");
        }, 2000);
      }
    });
  });
}

function attachWatchedHandlers(container: HTMLElement, movies: TMDBMovie[]) {
  const watchedButtons = container.querySelectorAll(
    ".btn-watched-browse:not(.added)",
  );

  watchedButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const btn = e.target as HTMLButtonElement;
      const movieId = parseInt(btn.dataset.movieId || "0");

      const movie = movies.find((m) => m.id === movieId);
      if (!movie) return;

      btn.disabled = true;
      btn.textContent = "Opening...";

      const modal = createWatchedModal(movie, () => {
        btn.textContent = "✓ Watched";
        btn.classList.add("added");
        showNotification(`${movie.title} marked as watched!`);
      });

      document.body.appendChild(modal);
      setTimeout(() => modal.classList.add("show"), 10);

      const closeBtn = modal.querySelector(".modal-close") as HTMLButtonElement;
      const cancelBtn = modal.querySelector(
        ".modal-cancel",
      ) as HTMLButtonElement;

      const reEnableButton = () => {
        btn.disabled = false;
        btn.textContent = "Mark as Watched";
      };

      closeBtn?.addEventListener("click", reEnableButton, { once: true });
      cancelBtn?.addEventListener("click", reEnableButton, { once: true });
      modal.addEventListener(
        "click",
        (e) => {
          if (e.target === modal) {
            reEnableButton();
          }
        },
        { once: true },
      );
    });
  });
}

function showNotification(
  message: string,
  type: "success" | "error" = "success",
) {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add("show"), 10);
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}