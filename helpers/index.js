const findGame = (gameId, games) => {
  return games.find((game) => {
    return game.id === gameId;
  });
};

const checkGameExists = (gameId, games) => {
  return findGame(gameId, games) ? true : false;
};

module.exports.findGame = findGame;
module.exports.checkGameExists = checkGameExists;
