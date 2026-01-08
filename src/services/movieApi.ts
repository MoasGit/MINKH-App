const API_BASE_URL = 'http://localhost:3000/api';

// Exempel: funktion för att hämta watchlist
// (Ni får själva välja hur ni strukturerar resterande anrop mot backend‑API:t.)

export async function getWatchlist(): Promise<Movie[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/movies?status=watchlist`);

    if (!response.ok) {
      throw new Error('Failed to fetch watchlist');
    }

    return await response.json();
    console.log("test" + response);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    throw error; // låt anropande kod hantera felet (t.ex. visa felmeddelande i UI:t)
  }
}