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

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

websockets(server);

app.get("/", (req, res) => {
  const id = short.generate();
  res.render("home", {
    id: id,
  });
});

app.get("/game", (req, res) => {
  console.log(req.query.game_id);
  res.render("home");
});
