const id = new URLSearchParams(window.location.search).get("id");

let socket = new WebSocket(`ws://${location.host}/websockets?id=${id}`);

const nameInput = document.querySelector("#name-input");
const setNameBtn = document.querySelector("#set-name");

const playerOutput = document.querySelector("#player-output");

const playerOneName = document.querySelector("#player-one-name");
const playerTwoName = document.querySelector("#player-two-name");

const currentTurnOutput = document.querySelector("#current-turn");

let piece = "";
let turn = "X";
let gameover = false;

const gameboardElement = document.querySelector(".gameboard");

let playerName;

socket.addEventListener("open", () => {
  playerName = window.localStorage.getItem("playerName");

  if (playerName) {
    socket.send(
      JSON.stringify({
        method: "set-player-name",
        playerName: playerName,
      })
    );
  } else {
    playerName = "";
  }
});

socket.addEventListener("message", ({ data }) => {
  const parsedMessage = JSON.parse(data);

  const { method } = parsedMessage;

  switch (method) {
    case "init":
      updatePlayer(parsedMessage.player);
      updatePlayerNameOutput(1, parsedMessage.playerOneName);
      updatePlayerNameOutput(2, parsedMessage.playerTwoName);
      // update board array etc too
      break;
    case "set-player-name":
      updatePlayerNameOutput(parsedMessage.player, parsedMessage.name);
      break;
    case "game-ready":
      enableGameBoard();
      break;
    case "move":
      updateMove(parsedMessage.player, parsedMessage.position);
      break;
    case "update-turn":
      turn = parsedMessage.turn;
      currentTurnOutput.innerHTML = `${turn}'s turn`;
      break;
    case "game-over":
      currentTurnOutput.innerHTML = `${parsedMessage.winner} wins!`;
      gameover = true;
    default:
      return;
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
    window.localStorage.setItem("playerName", playerName);
    socket.send(
      JSON.stringify({
        method: "set-player-name",
        playerName: playerName,
      })
    );
  }
};

const updatePlayer = (player) => {
  nameInput.value = playerName;
  if (player === 1) {
    playerOutput.innerHTML = "You are X";
    piece = "X";
  } else if (player === 2) {
    playerOutput.innerHTML = "You are O";
    piece = "O";
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

const enableGameBoard = () => {
  gameboardElement.classList.add("gameboard--active");
};

gameboardElement.addEventListener("mouseover", (e) => {
  if (turn !== piece) return;
  if (gameover) return;
  if (!e.target.classList.contains("gameboard__block")) return;
  if (e.target.dataset.containspiece === "true") return;

  e.target.children[0].innerHTML = piece;

  e.target.addEventListener(
    "mouseout",
    () => {
      if (e.target.dataset.containspiece === "true") return;
      e.target.children[0].innerHTML = "";
    },
    { once: true }
  );
});

gameboardElement.addEventListener("click", (e) => {
  if (turn !== piece) return;
  if (gameover) return;
  if (!e.target.classList.contains("gameboard__block")) return;
  if (e.target.dataset.containspiece === "true") return;

  sendMessage({
    method: "move",
    position: e.target.dataset.position,
  });
});

const sendMessage = (message) => {
  socket.send(JSON.stringify(message));
};

const updateMove = (player, position) => {
  let newPiece = "";
  if (player === 1) {
    newPiece = "X";
  } else if (player === 2) {
    newPiece = "O";
  }

  gameboardElement.querySelector(
    `[data-position='${position}']`
  ).children[0].innerHTML = newPiece;
  gameboardElement.querySelector(
    `[data-position='${position}']`
  ).dataset.containspiece = "true";
  gameboardElement
    .querySelector(`[data-position='${position}']`)
    .classList.add("gameboard__block--contains-piece");
};
