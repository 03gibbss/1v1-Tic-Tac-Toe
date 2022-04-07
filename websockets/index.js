// https://cheatcode.co/tutorials/how-to-set-up-a-websocket-server-with-node-js-and-express
// https://cheatcode.co/tutorials/how-to-set-up-a-websocket-client-with-javascript

const WebSocket = require("ws");
const queryString = require("query-string");
const short = require("short-uuid");

const {
  findGame,
  checkGameExists,
  winningCombinations,
} = require("../helpers");

module.exports = async (expressServer, games) => {
  const wss = new WebSocket.Server({
    noServer: true,
    path: "/websockets",
  });

  expressServer.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (websocket) => {
      wss.emit("connection", websocket, request);
    });
  });

  wss.on("connection", function connection(ws, connectionRequest) {
    handleConnection(ws, connectionRequest);

    ws.on("message", (message) => {
      handleMessage(ws, message);
    });

    ws.on("close", () => {
      handleClose(ws);
    });
  });

  const handleConnection = (ws, connectionRequest) => {
    const [_path, params] = connectionRequest?.url?.split("?");
    const connectionParams = queryString.parse(params);
    // ws://localhost:3000/websockets?id=123

    ws.gameId = connectionParams.id;
    ws.socketId = short.generate();

    if (!checkGameExists(ws.gameId, games)) {
      ws.close(1000, "This game ID does not exist");
      return;
    }

    ws.player = joinGame(ws.gameId, ws.socketId);

    const game = findGame(ws.gameId, games);

    messageClient(ws, {
      method: "init",
      player: ws.player,
      playerOne: game.playerOne,
      playerTwo: game.playerTwo,
      playerOneName: game.playerOneName,
      playerTwoName: game.playerTwoName,
      state: game.state,
      boardArray: game.boardArray,
      turn: game.turn,
    });
  };

  const handleClose = (ws) => {
    removePlayerFromGame(ws.gameId, ws.socketId);
  };

  const handleMessage = (ws, message) => {
    if (ws.player === null) {
      ws.close(1000, "You are not allowed to send messages");
      return;
    }

    const parsedMessage = JSON.parse(message);

    const { method } = parsedMessage;

    switch (method) {
      case "set-player-name":
        const { playerName } = parsedMessage;
        setPlayerName(ws.gameId, ws.player, playerName);
        messageAllClients({
          method: "set-player-name",
          player: ws.player,
          name: playerName,
        });
        break;
      case "move":
        makeMove(ws.gameId, ws.player, parsedMessage.position);
        break;
      default:
        return;
    }
  };

  const makeMove = (gameId, player, position) => {
    const game = findGame(gameId, games);
    game["boardArray"][position] = player;

    const win = checkForWin(game.boardArray);

    // broadcast move
    messageAllClientsInGame(
      {
        method: "move",
        player: player,
        position: position,
      },
      gameId
    );
    // update turn
    if (player === 1) {
      game["turn"] = "O";
    } else {
      game["turn"] = "X";
    }
    messageAllClientsInGame(
      {
        method: "update-turn",
        turn: game["turn"],
      },
      gameId
    );

    if (win) {
      messageAllClientsInGame(
        {
          method: "game-over",
          winner: player,
        },
        gameId
      );
    }
  };

  const checkForWin = (boardArray) => {
    let win = false;

    winningCombinations.forEach((winningCombination) => {
      let xmatches = 0;
      let ymatches = 0;

      winningCombination.forEach((position) => {
        if (boardArray[position - 1] === 1) {
          xmatches++;
        } else if (boardArray[position - 1] === 2) {
          ymatches++;
        }
      });

      if (xmatches === 3) {
        win = true;
      } else if (ymatches === 3) {
        win = true;
      }
    });
    return win;
  };

  const setPlayerName = (gameId, player, playerName) => {
    const game = findGame(gameId, games);

    if (game === undefined) return;

    if (player === 1) {
      game.playerOneName = playerName;
    } else if (player === 2) {
      game.playerTwoName = playerName;
    }
  };

  const messageClient = (ws, message) => {
    ws.send(JSON.stringify(message));
  };

  const messageAllClients = (message) => {
    // need something here to filter to just the current game?
    wss.clients.forEach((client) => {
      client.send(JSON.stringify(message));
    });
  };

  const messageAllClientsInGame = (message, gameId) => {
    wss.clients.forEach((client) => {
      if (client.gameId === gameId) {
        client.send(JSON.stringify(message));
      }
    });
  };

  const messageAllOtherClients = (message, ws) => {
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  };

  const joinGame = (gameId, socketId) => {
    let game = findGame(gameId, games);

    if (game === undefined) {
      // doesn't exist
      return null;
    }

    if (game.playerOne === null) {
      game.playerOne = socketId;
      console.log(`${socketId} is player one in ${gameId}`);
      return 1;
    } else if (game.playerTwo === null) {
      game.playerTwo = socketId;
      console.log(`${socketId} is player two in ${gameId}`);
      gameIsReady(gameId);
      return 2;
    } else {
      // too many players are connected
      return null;
    }
  };

  const removePlayerFromGame = (gameId, socketId) => {
    const game = games.find((game) => {
      return game.id === gameId;
    });

    if (game !== undefined) {
      if (game.playerOne === socketId) {
        console.log(`${socketId} is no longer player one in ${gameId}`);
        game.playerOne = null;
      } else if (game.playerTwo === socketId) {
        console.log(`${socketId} is no longer player two in ${gameId}`);
        game.playerTwo = null;
      }
    }
  };

  const gameIsReady = (gameId) => {
    messageAllClientsInGame(
      {
        method: "game-ready",
      },
      gameId
    );
  };

  return wss;
};
