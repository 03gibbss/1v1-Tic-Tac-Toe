const id = new URLSearchParams(window.location.search).get("id");

let socket = new WebSocket(`ws://localhost:3000/websockets?id=${id}`);

const nameInput = document.querySelector("#name-input");
const setNameBtn = document.querySelector("#set-name");

const playerOutput = document.querySelector("#player-output");

const playerOneName = document.querySelector("#player-one-name");
const playerTwoName = document.querySelector("#player-two-name");

const responses = document.querySelector("#responses");

let playerName = "";

socket.addEventListener("open", () => {});

socket.addEventListener("message", ({ data }) => {
  const parsedMessage = JSON.parse(data);

  const { method } = parsedMessage;

  switch (method) {
    case "update-player":
      updatePlayer(parsedMessage.player);
      break;
    case "set-player-name":
      updatePlayerNameOutput(parsedMessage.player, parsedMessage.name);
    default:
      // adjust this
      const { message } = parsedMessage;
      const response = document.createElement("p");
      response.innerHTML = message;
      responses.append(response);
  }
});

socket.addEventListener("error", (event) => {
  console.log(event);
});

socket.addEventListener("close", () => {
  console.log("Socket closed by server");
  socket = null;
});

const updatePlayerName = () => {
  if (playerName !== nameInput.value) {
    playerName = nameInput.value;
    socket.send(
      JSON.stringify({
        method: "set-player-name",
        playerName: playerName,
      })
    );
  }
};

const updatePlayer = (player) => {
  nameInput.value = `Player ${player}`;
  if (player === 1) {
    playerOutput.innerHTML = "You are X";
  } else if (player === 2) {
    playerOutput.innerHTML = "You are O";
  } else {
    playerOutput.innerHTML = "You are a spectator";
  }
};

setNameBtn.addEventListener("click", updatePlayerName);

const updatePlayerNameOutput = (player, playerName) => {
  if (player === 1) {
    playerOneName.innerHTML = playerName;
  } else if (player === 2) {
    playerTwoName.innerHTML = playerName;
  }
};
