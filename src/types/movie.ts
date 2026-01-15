export interface TMDBMovie {
    id: number;
    title: string;
    overview: string;
    poster_path: string;
    release_date: string;
    vote_average: number;
}

// ⭐ NEW: Extended movie details from TMDB API
export interface TMDBMovieDetails extends TMDBMovie {
    backdrop_path: string | null;
    runtime: number | null;
    genres: Array<{
        id: number;
        name: string;
    }>;
    tagline?: string;
    budget?: number;
    revenue?: number;
    status?: string;
}

// Film från din databas (sparade filmer med watchlist eller watched status)
export interface DatabaseMovie {
    id: number; // Databas-id
    tmdb_id: number; // TMDB-id
    title: string;
    poster_path: string | null;
    release_date: string | null;
    vote_average: number | null;
    overview: string | null;
    in_watchlist: number;
    is_watched: number;
    personal_rating: number | null;
    review: string | null;
    is_favorite: number;
    date_added: string;
    date_watched: string | null;
}

// Typ som matchar serverns CreateMovieBody-interface
export interface CreateMovieBody {
    tmdb_id: number;
    title: string;
    poster_path: string;
    release_date: string;
    vote_average: number;
    overview?: string;
    in_watchlist?: boolean;
    is_watched?: boolean;
    personal_rating?: number | null;
    review?: string | null;
    is_favorite?: boolean;
    date_watched?: string | null;
}