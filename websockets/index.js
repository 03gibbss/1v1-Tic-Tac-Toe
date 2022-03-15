// https://cheatcode.co/tutorials/how-to-set-up-a-websocket-server-with-node-js-and-express

const WebSocket = require("ws");
const queryString = require("query-string");

module.exports = async (expressServer) => {
  const websocketServer = new WebSocket.Server({
    noServer: true,
    path: "/websockets",
  });

  expressServer.on("upgrade", (request, socket, head) => {
    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit("connection", websocket, request);
    });
  });

  websocketServer.on(
    "connection",
    function connection(websocketConnection, connectionRequest) {
      const [_path, params] = connectionRequest?.url?.split("?");
      const connectionParams = queryString.parse(params);

      // ws://localhost:3000/websockets?test=123&test2=456
      console.log(connectionParams);

      websocketConnection.on("message", (message) => {
        const parsedMessage = JSON.parse(message);
        console.log(parsedMessage);
        websocketConnection.send(
          JSON.stringify({ message: "There be gold in them thar hills." })
        );
      });
    }
  );

  return websocketServer;
};
