require("dotenv").config();
const express = require("express");
const short = require("short-uuid");
const { engine } = require("express-handlebars");
const path = require("path");

const websockets = require("./websockets");

const app = express();

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

app.use(express.static(path.join(__dirname, "public")));

const { checkGameExists } = require("./helpers");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});

const games = [];

websockets(server, games);

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/create-game", (req, res) => {
  const id = short.generate();
  games.push({
    id: id,
    playerOne: null,
    playerTwo: null,
    playerOneName: "Player One",
    playerTwoName: "Player Two",
    state: "preparing",
    boardArray: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    turn: "X",
  });
  res.redirect(`/game?id=${id}`);
});

app.get("/game", (req, res) => {
  const id = req.query.id;
  if (checkGameExists(id, games)) {
    res.render("game", {
      id,
    });
  } else {
    res.redirect("/");
  }
});

app.get("/*", (req, res) => {
  res.redirect("/");
});
