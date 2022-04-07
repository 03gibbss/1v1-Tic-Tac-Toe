document.querySelector("form").addEventListener("submit", (e) => {
  e.preventDefault();

  const gameCode = document.querySelector("#game-code-input")?.value;

  if (gameCode) {
    location.href = `http://localhost:3000/game?id=${gameCode}`;
  }
});
