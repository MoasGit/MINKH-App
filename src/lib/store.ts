import type { TMDBMovie } from "../types/movie";
//import { getPopularMoviesTMDB  } from "../services/tmdbApi.ts";
import type { fetchTopMovies } from "../services/tmdbApi";

class Store {
  renderCallback: () => void;

  
  // TMDB API state
  TopMovies: TMDBMovie[] = [];
  constructor() {
    this.renderCallback = () => {};
  }

  
  async loadTopMovies(shouldTriggerRender: boolean = true) {
    try {
      //this.popularMovies = await getPopularMoviesTMDB();
      if (shouldTriggerRender) {
        this.triggerRender();
      }
      
      return this.TopMovies;
    } catch (error) {
      console.error("Failed to load popular movies:", error);
      return [];
    }
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


export const loadTopMovies = store.loadTopMovies.bind(store);  // Async
export const setRenderCallback = store.setRenderCallback.bind(store);