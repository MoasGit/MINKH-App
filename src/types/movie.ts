export interface TMDBMovie {
    id: number;
    title: string;
    overview: string;
    poster_path: string;
    release_date: string;
    vote_average: number;
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