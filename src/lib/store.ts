import type { TMDBMovie } from "../types/movie";
//import { getPopularMoviesTMDB  } from "../services/tmdbApi.ts";
import type { fetchMovies } from "../services/tmdbApi";

class Store {
  renderCallback: () => void;

  
  // TMDB API state
  popularMovies: TMDBMovie[] = [];
  constructor() {
    this.renderCallback = () => {};
  }

  
  async loadPopularMovies(shouldTriggerRender: boolean = true) {
    try {
      //this.popularMovies = await getPopularMoviesTMDB();
      if (shouldTriggerRender) {
        this.triggerRender();
      }
      
      return this.popularMovies;
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


export const loadPopularMovies = store.loadPopularMovies.bind(store);  // Async
export const setRenderCallback = store.setRenderCallback.bind(store);