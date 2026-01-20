// src/components/movieDetailsModal.ts
import { TMDB_IMAGE_BASE_URL } from "../services/tmdbApi";
import type {
  TMDBMovie,
  DatabaseMovie,
  TMDBMovieDetails,
} from "../types/movie";

// Type guard to check if movie is DatabaseMovie
function isDatabaseMovie(
  movie: DatabaseMovie | TMDBMovie,
): movie is DatabaseMovie {
  return "id" in movie && "tmdb_id" in movie;
}

export function createMovieDetailsModal(
  movie: DatabaseMovie | TMDBMovie,
  movieDetails: TMDBMovieDetails,
): HTMLElement {
  const modal = document.createElement("div");
  modal.className = "movie-details-modal";

  const title = movie.title;
  const releaseYear = movie.release_date?.substring(0, 4) || "N/A";
  const rating = movie.vote_average?.toFixed(1) || "N/A";
  const overview = movie.overview || "No description available.";
  const posterPath = movie.poster_path
    ? TMDB_IMAGE_BASE_URL + movie.poster_path
    : "/placeholder.jpg";

  // Use backdrop from detailed movie data
  const backdropPath = movieDetails.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movieDetails.backdrop_path}`
    : "";

  // Additional details from TMDB
  const runtime = movieDetails.runtime ? `${movieDetails.runtime} min` : "N/A";
  const genres = movieDetails.genres?.map((g) => g.name).join(", ") || "N/A";

  // Check if it's a database movie (has personal data)
  const isDatabaseMov = isDatabaseMovie(movie);
  const personalRating = isDatabaseMov
    ? (movie as DatabaseMovie).personal_rating
    : null;
  const isWatched = isDatabaseMov
    ? (movie as DatabaseMovie).is_watched === 1
    : false;
  const isFavorite = isDatabaseMov
    ? (movie as DatabaseMovie).is_favorite === 1
    : false;
  const inWatchlist = isDatabaseMov
    ? (movie as DatabaseMovie).in_watchlist === 1
    : false;

  modal.innerHTML = `
    <div class="modal-backdrop" style="${backdropPath ? `background-image: url('${backdropPath}')` : ""}">
      <div class="backdrop-overlay"></div>
    </div>
    
    <div class="modal-content-wrapper">
      <button class="modal-close" aria-label="Close">&times;</button>
      
      <div class="modal-content-details">
      
        <div class="poster-section">
          <img 
            src="${posterPath}" 
            alt="${title}"
            class="details-poster"
            onerror="this.src='/placeholder.jpg'"
          />
        </div>
        
        <div class="info-section">
          <h2 class="details-title">${title}</h2>
          
          <div class="meta-row">
            <span class="meta-item">
              <span class="meta-label">★ TMDB Rating:</span>
              <span class="meta-value">${rating}/10</span>
            </span>
            <span class="meta-item">
              <span class="meta-label">📅 Release:</span>
              <span class="meta-value">${releaseYear}</span>
            </span>
            <span class="meta-item">
              <span class="meta-label">⏱️ Runtime:</span>
              <span class="meta-value">${runtime}</span>
            </span>
          </div>
          
          <div class="genres-row">
            <span class="meta-label">🎭 Genres:</span>
            <span class="meta-value">${genres}</span>
          </div>
          
          ${
            personalRating
              ? `
            <div class="personal-info">
              <strong>Your Rating:</strong>
              <div class="stars-inline">
                ${Array.from({ length: 5 }, (_, i) =>
                  i < personalRating ? "★" : "☆",
                ).join("")}
              </div>
            </div>
          `
              : ""
          }
          
          ${
            inWatchlist || isWatched || isFavorite
              ? `
            <div class="status-badges">
              ${inWatchlist ? '<span class="status-badge watchlist">✓ In Watchlist</span>' : ""}
              ${isWatched ? '<span class="status-badge watched">✓ Watched</span>' : ""}
              ${isFavorite ? '<span class="status-badge favorite">★ Favorite</span>' : ""}
            </div>
          `
              : ""
          }
          
          <div class="overview-section">
            <h3>Overview</h3>
            <p>${overview}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Close handlers
  const closeBtn = modal.querySelector(".modal-close") as HTMLButtonElement;

  function closeModal() {
    modal.classList.add("fade-out");
    setTimeout(() => modal.remove(), 300);
  }

  closeBtn.addEventListener("click", closeModal);

  // Click outside to close
  modal.addEventListener("click", (e) => {
    if (
      e.target === modal ||
      (e.target as HTMLElement).classList.contains("modal-backdrop")
    ) {
      closeModal();
    }
  });

  // ESC key to close
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", handleEscape);
    }
  };
  document.addEventListener("keydown", handleEscape);

  return modal;
}
