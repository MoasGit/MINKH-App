import "./style.css";
import { setRenderCallback } from "./lib/store.ts";
import { clearAllMovies } from "./services/movieApi";

// Statiska sidor

import headerHTML from "./views/static/header/index.html?raw";
import footerHTML from "./views/static/footer/index.html?raw";
import browse from "./views/browse/index.ts";
import watched from "./views/watched/index.ts";
import watchList from "./views/watchlist/index.ts";


// Dynamiska sidor
//import about from "./views/about/index.ts";


const currentPage = (): string | HTMLElement => {
  const path = window.location.pathname;
   switch (path) {
    case "/":
      return browse();
      case "/watched":
      return watched();
      case "/watchlist":
      return watchList();
    default:
      return "404";
  }
};

const app = document.querySelector("#app")!;

const updateActiveNav = () => {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('nav ul li a');
  
  navLinks.forEach(link => {
    const linkPath = new URL((link as HTMLAnchorElement).href).pathname;
    const parentLi = link.parentElement;
    
    if (linkPath === currentPath) {
      parentLi?.classList.add('active');
    } else {
      parentLi?.classList.remove('active');
    }
  });
};

// Funktionen som renderar sidan
const renderApp = () => {

  const page = currentPage();
    
  if(typeof page === "string") {


    app.innerHTML = `
          ${headerHTML} 
          ${page} 
          ${footerHTML}`;

  } else {


    app.innerHTML = 
    `${headerHTML} 
     ${footerHTML}`;

     app.insertBefore(page, app.querySelector("footer")!);

  }

  updateActiveNav();

  setupClearDatabaseButton();

};

const setupClearDatabaseButton = () => {
  const clearBtn = document.querySelector('#clear-db-btn') as HTMLButtonElement;
  
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      const confirmed = confirm(
        '⚠️ WARNING: This will delete ALL movies from your database!\n\n' +
        'This action cannot be undone.\n\n' +
        'Are you sure you want to continue?'
      );
      
      if (!confirmed) return;
      
      // Double confirmation
      const doubleConfirmed = confirm(
        'This is your last chance!\n\n' +
        'Click OK to permanently delete all data.'
      );
      
      if (!doubleConfirmed) return;
      
      clearBtn.disabled = true;
      clearBtn.textContent = '🔄 Clearing...';
      
      try {
        await clearAllMovies();
        
        clearBtn.textContent = '✅ Cleared!';
        
        // Show success notification
        showClearNotification('Database cleared successfully!', 'success');
        
        // Reload page after short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
      } catch (error) {
        console.error('Failed to clear database:', error);
        clearBtn.textContent = '❌ Failed';
        showClearNotification('Failed to clear database', 'error');
        
        setTimeout(() => {
          clearBtn.disabled = false;
          clearBtn.textContent = '🗑️ Clear All Data';
        }, 2000);
      }
    });
  }
};

function showClearNotification(message: string, type: 'success' | 'error' = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Initialisera appen
renderApp();

// Rerender-logic 
// Om sidan ändras, rerenderas appen
window.addEventListener("popstate", () => {
  renderApp();
});

// Intercepta länkar och hantera navigation
// Detta förhindrar att sidan laddas om och bevarar state
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  const link = target.closest("a");
  
  if (link && link.href.startsWith(window.location.origin)) {
    e.preventDefault();
    const path = new URL(link.href).pathname;
    window.history.pushState({}, "", path);
    renderApp();
  }
});

console.log("hej");
// Set render callback
setRenderCallback(renderApp);