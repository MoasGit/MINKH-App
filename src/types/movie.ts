// Film från TMDB API
export interface TMDBMovie {
    id: number;
    title: string;
    overview: string;
    poster_path: string;
    release_date: string;
    vote_average: number;
}

// Film från TMDB API - med extra details för modalerna
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

// Film från vår databas (sparade filmer med watchlist eller watched status)
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

// Blueprint för att skapa en film i vår db
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