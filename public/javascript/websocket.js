const gameId = new URLSearchParams(window.location.search).get("game_id");

const socket = new WebSocket(`ws://localhost:3000/websockets?gameId=${gameId}`);

socket.addEventListener("open", () => {
  socket.send(JSON.stringify({ message: "Hello Server!" }));
});

socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  console.log(message);
});
