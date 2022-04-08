const id = new URLSearchParams(window.location.search).get("id");
let socket = new WebSocket(`ws://${location.host}/websockets?id=${id}`);

const nameContainerEl = document.querySelector(".name");
const nameOutputEl = document.querySelector(".name__output");
const nameFormEl = document.querySelector(".name__form");
const nameInputEl = document.querySelector(".name__input");

const idTooltipEl = document.querySelector(".gamecode__tooltip");
const idTooltipTextEl = document.querySelector(".gamecode__tooltip-text");

let playerName = undefined;

function loadPlayerName() {
  let savedName = window.localStorage.getItem("playerName");

  if (!savedName) return;

  updatePlayerName(savedName);
}

document.addEventListener("click", ({ target }) => {
  if (!target.closest(".name")) {
    nameContainerEl.classList.remove("name--edit");
  }

  if (target.closest(".name")) {
    nameContainerEl.classList.add("name--edit");
    nameInputEl.select();
  }

  if (target.closest(".gamecode__tooltip")) {
    navigator.clipboard.writeText(id);
    idTooltipTextEl.innerHTML = "Copied ID!";
  }
});

idTooltipEl.addEventListener("mouseout", () => {
  idTooltipTextEl.innerHTML = "Copy ID";
});

nameFormEl.addEventListener("submit", (e) => {
  e.preventDefault();

  nameContainerEl.classList.remove("name--edit");

  updatePlayerName(nameInputEl.value);
});

function updatePlayerName(name) {
  if (playerName === name) return;

  playerName = name;
  nameOutputEl.innerHTML = name;
  nameInputEl.value = name;

  window.localStorage.setItem("playerName", name);

  if (socket.readyState !== 1) return;

  sendMessage({
    method: "set-player-name",
    playerName: name,
  });
}

// Game Output

let playerNumber = undefined;

const pieceOutput = document.querySelector("#piece-output");

const playerOneName = document.querySelector("#player-one-name");
const playerTwoName = document.querySelector("#player-two-name");

const currentTurnOutput = document.querySelector("#current-turn");

let piece = "";
let turn = "X";
let gameover = false;

const gameboardElement = document.querySelector(".gameboard");

socket.addEventListener("open", () => {
  if (playerName) {
    sendMessage({ method: "set-player-name", playerName: playerName });
  }
});

socket.addEventListener("message", ({ data }) => {
  const parsedMessage = JSON.parse(data);

  const { method } = parsedMessage;

  switch (method) {
    case "init":
      updatePlayerNumber(parsedMessage.player);
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

const updatePlayerNumber = (number) => {
  playerNumber = number;
  if (number === 1) {
    pieceOutput.innerHTML = "You are X";
    piece = "X";
  } else if (number === 2) {
    pieceOutput.innerHTML = "You are O";
    piece = "O";
  } else {
    pieceOutput.innerHTML = "You are a spectator";
  }
};

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

function init() {
  loadPlayerName();
}

init();
