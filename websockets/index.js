// https://cheatcode.co/tutorials/how-to-set-up-a-websocket-server-with-node-js-and-express
// https://cheatcode.co/tutorials/how-to-set-up-a-websocket-client-with-javascript

const WebSocket = require("ws");
const queryString = require("query-string");
const short = require("short-uuid");

const { findGame, checkGameExists } = require("../helpers");

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

    messageClient(ws, { method: "update-player", player: ws.player });
  };

  const handleClose = (ws) => {
    removePlayerFromGame(ws.gameId, ws.socketId);
  };

  const handleMessage = (ws, message) => {
    const parsedMessage = JSON.parse(message);

    const { method } = parsedMessage;

    switch (method) {
      case "set-player-name":
        const { playerName } = parsedMessage;
        ws.playerName = playerName;
        messageAllClients({
          method: "set-player-name",
          player: ws.player,
          name: ws.playerName,
        });
        break;
      default:
        return;
    }
  };

  const messageClient = (ws, message) => {
    ws.send(JSON.stringify(message));
  };

  const messageAllClients = (message) => {
    wss.clients.forEach((client) => {
      client.send(JSON.stringify(message));
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
    }

    if (game.playerOne === null) {
      game.playerOne = socketId;
      console.log(`${socketId} is player one in ${gameId}`);
      return 1;
    } else if (game.playerTwo === null) {
      game.playerTwo = socketId;
      console.log(`${socketId} is player two in ${gameId}`);
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

  return wss;
};
