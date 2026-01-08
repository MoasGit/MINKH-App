export default function divTest(): HTMLElement{
  const divTest = document.createElement("div");
  
  divTest.innerHTML = `
   
    <p>HÄR ÄR DIVEN</p>
  `;
  return divTest;
};