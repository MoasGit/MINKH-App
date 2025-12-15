# Projektuppgift: Filmkollen 🍿

## 📋 Översikt

Ni ska utveckla en applikation för att hålla koll på filmer där användare kan bläddra bland filmer, hantera sin watchlist och hålla reda på sedda filmer med betyg och recensioner. Syftet med uppgiften är att öva på API‑integration, CRUD‑operationer och att bygga en strukturerad TypeScript‑applikation.

Ni ska utgå från den projektstruktur som föreslås i det här repot (mer resonemang om strukturen finns [här](https://devdecodes.medium.com/building-modular-web-apps-with-vanilla-javascript-no-frameworks-needed-631710bae703)):

```
src/
├── components/               // Återanvändbara komponenter (valfritt)
├── assets/                   // Bilder, ikoner m.m.
├── pages/                    // Sidvyer (valfritt - om en vy är en sida)
├── views/                    // Vyer kopplade till olika routes
│   ├── browse/
│   ├── watchlist/
│   ├── watched/
│   └── static/
├── services/
│   ├── tmdbApi.ts            // fetch-funktioner mot TMDB‑API 
│   └── movieApi.ts           // fetch-funktioner för att spara filmer i watchlist (Node-js/Express/SQLLite backend-API)
│                            
├── lib/
│   └── store.ts              // Hanterar globalt state
└── types/
    └── movie.ts              // Typer/interfaces som delas mellan flera delar av appen
```

---

## 🚀 Krav

### 1. Söka och browsa bland filmer (`/` eller `/browse`)

**Använd fetch() för att hämta från TMDB‑API:et:**

- Utan sökterm:
  - Visa en lista med filmer (t.ex. "Popular" från TMDB som standardläge)
- Med sökterm:
  - Visa sökresultat från TMDB‑API i samma lista 
- Varje filmkort ska visa:
  - Filmposter, titel, betyg, releaseår och en kort beskrivning
- Varje filmkort ska ha:
  - "Lägg till i Watchlist"-knapp
  - "Markera som sedd"-knapp
  - Länk/knapp för att visa detaljer
  - Visuell indikator om filmen redan finns i watchlist eller som watched


### 2. Användarens att-se-lista (`/watchlist`)

**Visa filmer du vill se:**

- Visa alla filmer i din watchlist (lagras via backend‑API:et)
- Varje film ska visa:
  - Poster, titel, releaseår, betyg
  - Datum när den lades till i watchlisten
  - "Markera som sedd"-knapp
- Visa tom‑state om watchlisten är tom
- Visa totalt antal filmer i watchlist

### 3. Lista på redan sedda filmer (`/watched`)

**Håll reda på filmer du redan har sett:**

- Visa alla sedda filmer
- Varje film visar:
  - Poster, titel, releaseår
  - Ditt personliga betyg (1–5 stjärnor)
  - Toggle "Markera som favorit"
  - "Ta bort"-knapp
  - "Redigera betyg/recension"-knapp
- Filteralternativ:
  - Alla sedda filmer
  - Endast favoriter
  - Efter betyg (5 stjärnor, 4 stjärnor, osv.)

### 4. Movie Details‑vy (modal eller formulär)

**Visa grundläggande information och ge möjlighet att lägga till/markera som sedd samt redigera ditt betyg och din recension för en vald film:**

- Enkel vy som kan vara:
  - En modal ovanpå nuvarande sida **eller**
  - En egen sida med ett formulär
- Visa minst:
  - Poster
  - Titel
  - TMDB‑betyg (från API:t)
- Tillgängliga åtgärder (knappar/formulärfält):
  - Lägg till i Watchlist
  - Markera som sedd
- Om filmen är sedd:
  - Visa/ändra ditt personliga betyg (1–5)
  - Visa/ändra din recension/anteckning

---

## 🏗️ Tekniska instruktioner

### 1. Hur du använder TMDB för att hämta filmdata

- [The Movie Database (TMDB) API](https://www.themoviedb.org/settings/api) – gratis och bra dokumentation

Kom igång med TMDB på [denna länk](https://developer.themoviedb.org/docs/getting-started). Registrera dig och hämta API-nyckel. 

> **OBS!** TMDB använder ni **endast** för att hämta filmdata (listor, sök, detaljer, bilder).  
> All funktionalitet kring **watchlist, sedda filmer, favoriter, personliga betyg och recensioner** ska implementeras via kursens **Express‑backend‑API**, *inte* via TMDB:s egna “account/watchlist/favorite”-endpoints.

Skapa en API‑service‑modul (`src/services/tmdbApi.ts`):

```
// Konfiguration

const TMDB_API_KEY = 'your_api_key_here';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
```
Läs mer under [Getting Started](api.themoviedb.org)


### 2. State Management

Bygg ut `Store`‑klassen så att den kan hantera **allt centralt film‑state** (browse‑lista, watchlist, watched, vald film, loading‑status) och anropa en render‑funktion när state ändras.

Lokalt state (t.ex. i vyer/komponenter) kan du fortfarande använda för små, temporära saker – som öppna/stängda modaler, formulärfält eller vilken flik som är aktiv – men **delad data mellan vyer** ska ligga i `Store`.


### 3. Använda TypeScript

- Definiera tydliga interfaces/typer för alla datastrukturer
- Ingen `any` (använd `unknown` vid behov)

```typescript
interface Movie {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  releaseDate: string;
  voteAverage: number;
}

interface WatchedMovie extends Movie {
  personalRating: number; // 1-5
  dateWatched: string;
  review?: string;
  isFavorite: boolean;
}

interface AppState {
  browseMovies: Movie[];
  watchlist: Movie[];
  watchedMovies: WatchedMovie[];
  selectedMovie: Movie | null;
  loading: boolean;
}
```



### 4. Backend‑API‑integration

Istället för att använda `localStorage` ska du nu prata med ett riktigt Express‑backend‑API:

- Skicka HTTP‑requests (GET, POST, PUT, DELETE) för att spara och hämta data
- Hantera loading‑state medan du väntar på svar
- Hantera fel‑state när anrop misslyckas
- Förstå uppdelningen mellan frontend och backend

```typescript
// src/services/movieApi.ts
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
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    throw error; // låt anropande kod hantera felet (t.ex. visa felmeddelande i UI:t)
  }
}
```


### 5. Felhantering

- Visa användarvänliga felmeddelanden när API‑anrop misslyckas
- Hantera loading‑state med t.ex. spinner eller skeleton‑UI
- Validera användarinput för betyg och recensioner
- Hantera saknade bilder snyggt (visa placeholder)



---

## 🎨 UI/UX‑riktlinjer, tillgänglighet

Sidan ska vara **responsiv**, följa **grundläggande tillgänglighetsprinciper** (kontrast, tangentbordsnavigering, tydliga länkar/knappar) och använda **enkla, konsekventa UI/UX‑mönster** så att användaren lätt förstår hur man söker, lägger till, markerar som sedd och redigerar filmer.



## 🔌 Att arbeta mot backend‑API:t

I det här projektet ska du arbeta mot en riktig Express‑server med SQLite‑databas.

### Backend‑setup

```bash
# Terminal 1: Start the backend server
cd movie-api
npm install
npm run dev
# Backend running on http://localhost:3000
```

```bash
# Terminal 2: Start your frontend
cd u06-vanilla-ts-project--filmlistan
npm install
npm run dev
# Frontend running on http://localhost:5173
```

### Göra API‑anrop

För exempel på hur ni anropar backend‑API:t, se `movie-api/README.md` (curl‑exempel och frontend‑kod).  
I denna uppgift räcker det att ni:

- Läser vilka endpoints som finns (metod, URL, body, svar).
- Skapar egna funktioner i `src/services/movieApi.ts` som anropar dessa endpoints med `fetch` och hanterar `loading`/fel i ert UI.


---

## 🌟 Förslag på vidareutveckling (för er som vill mer)

### Nivå 1: Förbättrade funktioner

1. **Pagination/Load More**
   - Implementera paginering för browse‑vyn
   - Visa t.ex. 20 filmer per "sida" i browse‑vyn
   - "Load more"‑knapp eller infinite scroll

2. **Avancerad filtrering**
   - Filtrera filmer på genre
   - Filtrera på releaseår/årtionde
   - Filtrera på betygsintervall
   - Kombinera flera filter samtidigt

3. **Personliga anteckningar på watchlist**
   - Lägg till anteckningar på filmer i watchlisten
   - T.ex. "Varför jag vill se den här"
   - Redigera/ta bort anteckningar

4. **Utökad watchlist‑funktionalitet**
   - Lägg till prioritet per film (t.ex. High, Medium, Low)
   - Lägg till/visa "Ta bort från Watchlist"‑knapp med bekräftelse
   - Lägg till sorteringsalternativ i watchlist‑vyn:
     - Efter datum tillagd (nyast/äldst)
     - Efter releaseår
     - Efter betyg (TMDB‑betyg)
     - Efter titel (A–Ö)

5. **Utökad watched‑vy (statistik och sortering)**
   - Sortera sedda filmer efter datum sedd, ditt betyg eller titel
   - Visa statistik över sedda filmer:
     - Totalt antal sedda filmer
     - Genomsnittligt personligt betyg
     - Antal favoriter

6. **Fler browse‑lägen**
   - Lägg till möjlighet att växla mellan olika lägen i browse‑vyn
   - T.ex. "Popular Movies", "Now Playing", "Top Rated", "Upcoming"


7. **Statistik‑dashboard**
   - Totalt antal sedda filmer
   - Genomsnittligt personligt betyg
   - Mest sedda genrer
   - Filmer sedda denna månad/år
   - Visuella diagram/grafer

8. **Egna filmsamlingar (Custom Collections)** 
   - Skapa egna filmsamlingar (t.ex. "Marvel MCU", "90-talsklassiker")


---

## 📚 Resurser

### TMDB‑API
- [TMDB API Documentation](https://developers.themoviedb.org/3)
- [Getting Started Guide](https://developers.themoviedb.org/3/getting-started/introduction)
- [Image Configuration](https://developers.themoviedb.org/3/getting-started/images)


### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Type vs Interface](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)


### Fetch‑API
- [MDN: Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- [MDN: async/await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)










