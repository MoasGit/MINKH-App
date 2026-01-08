import divTest from "../../components/divtest";

export default function watched(): HTMLElement {
  const container = document.createElement("div");
  container.className = "browse";

  const searchSection = document.createElement("div");
  searchSection.className = "search-section";
  searchSection.innerHTML = `
    <h2>Watched</h2>
  `;
  container.appendChild(searchSection);

  // Append the divTest element (call the imported factory)
  searchSection.appendChild(divTest());

  return container;
}