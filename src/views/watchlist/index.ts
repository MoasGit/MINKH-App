export default function watchList(): HTMLElement {
  const container = document.createElement("div");
  container.className = "browse";

  const searchSection = document.createElement("div");
  searchSection.className = "search-section";
  searchSection.innerHTML = `
    <h2>Watch List</h2>
  `;
  container.appendChild(searchSection);

  return container;
}