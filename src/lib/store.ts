import type { DatabaseMovie, TMDBMovie } from "../types/movie";
import { 
  getWatchlist as apiGetWatchlist,
  getWatched as apiGetWatched,
  addToWatchlist as apiAddToWatchlist,
  removeFromWatchlist as apiRemoveFromWatchlist,
  markAsWatched as apiMarkAsWatched,
  addAsWatched as apiAddAsWatched,
  updateWatched as apiUpdateWatched,
  deleteMovie as apiDeleteMovie,
  toggleFavorite as apiToggleFavorite
} from "../services/movieApi";

class Store {
  renderCallback: () => void;
  
  // Cached data
  private watchlistCache: DatabaseMovie[] = [];
  private watchedCache: DatabaseMovie[] = [];
  private lastFetch: { [key: string]: number } = {};
  
  // Cache duration: 5 minutes
  private CACHE_DURATION = 5 * 60 * 1000;

  constructor() {
    this.renderCallback = () => {};
  }

  // ========== WATCHLIST ==========
  
  async getWatchlist(forceRefresh = false): Promise<DatabaseMovie[]> {
    const cacheKey = 'watchlist';
    const now = Date.now();
    
    if (
      !forceRefresh && 
      this.watchlistCache.length > 0 && 
      this.lastFetch[cacheKey] && 
      (now - this.lastFetch[cacheKey]) < this.CACHE_DURATION
    ) {
      console.log('📦 Returning cached watchlist');
      return [...this.watchlistCache];
    }
    
    console.log('🌐 Fetching fresh watchlist from API');
    this.watchlistCache = await apiGetWatchlist();
    this.lastFetch[cacheKey] = now;
    return [...this.watchlistCache];
  }
  
  async addToWatchlist(movie: TMDBMovie): Promise<DatabaseMovie> {
    const saved = await apiAddToWatchlist(movie);
    this.watchlistCache.push(saved);
    console.log('✅ Added to watchlist cache');
    return saved;
  }
  
  async removeFromWatchlist(movieId: number): Promise<void> {
    await apiRemoveFromWatchlist(movieId);
    this.watchlistCache = this.watchlistCache.filter(m => m.id !== movieId);
    console.log('✅ Removed from watchlist cache');
  }
  
  // ========== WATCHED ==========
  
  async getWatched(forceRefresh = false): Promise<DatabaseMovie[]> {
    const cacheKey = 'watched';
    const now = Date.now();
    
    if (
      !forceRefresh && 
      this.watchedCache.length > 0 && 
      this.lastFetch[cacheKey] && 
      (now - this.lastFetch[cacheKey]) < this.CACHE_DURATION
    ) {
      console.log('📦 Returning cached watched');
      return [...this.watchedCache];
    }
    
    console.log('🌐 Fetching fresh watched from API');
    this.watchedCache = await apiGetWatched();
    this.lastFetch[cacheKey] = now;
    return [...this.watchedCache];
  }
  
  async markAsWatched(movieId: number, rating: number, review?: string): Promise<DatabaseMovie> {
    const updated = await apiMarkAsWatched(movieId, rating, review);
    
    const watchlistIndex = this.watchlistCache.findIndex(m => m.id === movieId);
    if (watchlistIndex !== -1) {
      this.watchlistCache[watchlistIndex] = updated;
    }
    
    const watchedIndex = this.watchedCache.findIndex(m => m.id === movieId);
    if (watchedIndex !== -1) {
      this.watchedCache[watchedIndex] = updated;
    } else {
      this.watchedCache.push(updated);
    }
    
    console.log('✅ Marked as watched in cache');
    return updated;
  }
  
  async addAsWatched(movie: TMDBMovie, rating: number, review?: string): Promise<DatabaseMovie> {
    const saved = await apiAddAsWatched(movie, rating, review);
    this.watchedCache.push(saved);
    console.log('✅ Added as watched to cache');
    return saved;
  }
  
  async updateWatched(movieId: number, rating: number, review?: string): Promise<DatabaseMovie> {
    const updated = await apiUpdateWatched(movieId, rating, review);
    
    const index = this.watchedCache.findIndex(m => m.id === movieId);
    if (index !== -1) {
      this.watchedCache[index] = updated;
    }
    
    console.log('✅ Updated watched in cache');
    return updated;
  }
  
  // ========== DELETE & FAVORITE ==========
  
  async deleteMovie(movieId: number): Promise<void> {
    await apiDeleteMovie(movieId);
    this.watchlistCache = this.watchlistCache.filter(m => m.id !== movieId);
    this.watchedCache = this.watchedCache.filter(m => m.id !== movieId);
    console.log('✅ Deleted movie from cache');
  }
  
  async toggleFavorite(movieId: number, isFavorite: boolean): Promise<DatabaseMovie> {
    const updated = await apiToggleFavorite(movieId, isFavorite);
    
    const watchlistIndex = this.watchlistCache.findIndex(m => m.id === movieId);
    if (watchlistIndex !== -1) {
      this.watchlistCache[watchlistIndex] = updated;
    }
    
    const watchedIndex = this.watchedCache.findIndex(m => m.id === movieId);
    if (watchedIndex !== -1) {
      this.watchedCache[watchedIndex] = updated;
    }
    
    console.log('✅ Toggled favorite in cache');
    return updated;
  }
  
  // ========== CACHE MANAGEMENT ==========
  
  clearCache() {
    this.watchlistCache = [];
    this.watchedCache = [];
    this.lastFetch = {};
    console.log('🗑️ Cache cleared');
  }
  
  // ========== RENDER CALLBACK ==========
  
  setRenderCallback(renderApp: () => void) {
    this.renderCallback = renderApp;
  }

  triggerRender() {
    if (this.renderCallback) {
      this.renderCallback();
    }
  }
}

const store = new Store();

// Export store methods
export const getWatchlist = store.getWatchlist.bind(store);
export const getWatched = store.getWatched.bind(store);
export const addToWatchlist = store.addToWatchlist.bind(store);
export const removeFromWatchlist = store.removeFromWatchlist.bind(store);
export const markAsWatched = store.markAsWatched.bind(store);
export const addAsWatched = store.addAsWatched.bind(store);
export const updateWatched = store.updateWatched.bind(store);
export const deleteMovie = store.deleteMovie.bind(store);
export const toggleFavorite = store.toggleFavorite.bind(store);
export const clearCache = store.clearCache.bind(store);
export const setRenderCallback = store.setRenderCallback.bind(store);
