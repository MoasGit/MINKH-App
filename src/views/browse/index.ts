export default function browse(): HTMLElement {
  const container = document.createElement("div");
  container.className = "browse";

  const searchSection = document.createElement("div");
  searchSection.className = "search-section";
  searchSection.innerHTML = `
    <h2>Browse Movies</h2>
  `;
  container.appendChild(searchSection);

  return container;
}