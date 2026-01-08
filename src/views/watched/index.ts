import divTest from "../../components/divTest";

export default function watched(): HTMLElement {
  const container = document.createElement("div");
  container.className = "browse";

  const searchSection = document.createElement("div");
  searchSection.className = "search-section";
  searchSection.innerHTML = `
  <h2>Static shit</h2>
  `;
  searchSection.appendChild(divTest());
  const moreShit = document.createElement("p");
  moreShit.innerHTML = `
  Här fortsätter skiten!!!!!!!!!!
  `;
  searchSection.appendChild(moreShit);
  container.appendChild(searchSection);

  // Append the divTest element (call the imported factory)
  //searchSection.appendChild(divTest());

  return container;
}