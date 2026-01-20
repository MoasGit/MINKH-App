import {
  fetchTopMovies,
  fetchMovies,
  fetchMovieDetails,
  TMDB_IMAGE_BASE_URL,
} from "../../services/tmdbApi";
import {
  addToWatchlist,
  getWatchlist,
  getWatched,
} from "../../services/movieApi";
import { createWatchedModal } from "../../components/watchedModal";
import { createMovieDetailsModal } from "../../components/movieDetailsModal";
import type { TMDBMovie, DatabaseMovie } from "../../types/movie";

let visibleMovieCount = 12;

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
  moviesContainer.innerHTML = "<p>Loading movies...</p>";
  container.appendChild(moviesContainer);

  loadMovies(moviesContainer);

  const searchInput = searchSection.querySelector(
    "#movie-search",
  ) as HTMLInputElement;
  const clearButton = searchSection.querySelector(
    "#clear-search",
  ) as HTMLButtonElement;

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
      loadMovies(moviesContainer);
    }
  });

  clearButton.addEventListener("click", () => {
    searchInput.value = "";
    clearButton.style.display = "none";
    loadMovies(moviesContainer);
  });

  return container;
}

async function loadMovies(container: HTMLElement) {
  visibleMovieCount = 12;
  try {
    container.innerHTML = '<p class="loading">Loading movies...</p>';

    const [movies, watchlist, watched] = await Promise.all([
      fetchTopMovies(),
      getWatchlist(),
      getWatched(),
    ]);

    displayMovies(movies, container, "Top Rated Movies", watchlist, watched);
  } catch (error) {
    console.error("Error loading movies:", error);
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
      `Search results for "${query}"`,
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
      </div>
    `;
    return;
  }

  const watchlistIds = new Set(watchlist.map((m) => m.tmdb_id));
  const watchedIds = new Set(watched.map((m) => m.tmdb_id));

  // ⭐ NYTT: Ta bara de filmer som ska visas
  const moviesToShow = movies.slice(0, visibleMovieCount);
  
  // ⭐ NYTT: Kolla om det finns fler filmer
  const hasMore = visibleMovieCount < movies.length;
  
  // ⭐ NYTT: Räkna kvarvarande filmer
  const remaining = movies.length - visibleMovieCount;

  // ÄNDRA: Använd moviesToShow istället för movies
  container.innerHTML = moviesToShow
    .map((movie) => {
      const inWatchlist = watchlistIds.has(movie.id);
      const isWatched = watchedIds.has(movie.id);

      return `
      <div class="movie-card" data-tmdb-id="${movie.id}">
        <div class="movie-poster-wrapper" data-movie-id="${movie.id}">
          <img 
            src="${movie.poster_path ? TMDB_IMAGE_BASE_URL + movie.poster_path : "/placeholder.png"}" 
            alt="${movie.title}"
            onerror="this.src='/placeholder.png'"
          />
          <div class="poster-overlay">
            
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
      // Öka antalet synliga filmer
      visibleMovieCount += 12;
      
      // Begränsa om nödvändigt
      if (visibleMovieCount > movies.length) {
        visibleMovieCount = movies.length;
      }
      
      // Rita om med fler filmer
      displayMovies(movies, container, title, watchlist, watched);
    });
  }
 

  // ⭐ NEW: Attach click handlers for movie details
  attachDetailsHandlers(container, moviesToShow);
  attachWatchlistHandlers(container, moviesToShow);
  attachWatchedHandlers(container, moviesToShow);
}

// ⭐ NEW: Handle clicks to open movie details modal
function attachDetailsHandlers(container: HTMLElement, movies: TMDBMovie[]) {
  const posterWrappers = container.querySelectorAll(".movie-poster-wrapper");

  posterWrappers.forEach((wrapper) => {
    wrapper.addEventListener("click", async (e) => {
      e.stopPropagation(); // Prevent event bubbling

      const movieId = parseInt((wrapper as HTMLElement).dataset.movieId || "0");
      const movie = movies.find((m) => m.id === movieId);
      if (!movie) return;

      // Show loading state
      const overlay = wrapper.querySelector(".poster-overlay") as HTMLElement;
      if (overlay) {
        overlay.innerHTML = "";
      }

      try {
        // Fetch full movie details (includes backdrop)
        const movieDetails = await fetchMovieDetails(movie.id);

        // Create and show modal
        const modal = createMovieDetailsModal(movie, movieDetails);
        document.body.appendChild(modal);

        // Fade in animation
        setTimeout(() => modal.classList.add("show"), 10);
      } catch (error) {
        console.error("Failed to load movie details:", error);
        showNotification("Failed to load movie details", "error");
      } finally {
        // Reset overlay
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
      e.stopPropagation(); // Prevent triggering details modal
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
      e.stopPropagation(); // Prevent triggering details modal
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
