import "./style.css";
import { setRenderCallback } from "./lib/store.ts";

// Statiska sidor
// måste refererera till den specifika .html filen med "?raw" för att kunna läsas in
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

// ⭐ NEW: Function to update active navigation state
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

  // ⭐ NEW: Update active nav after rendering
  updateActiveNav();

};

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