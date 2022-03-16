const findGame = (gameId, games) => {
  return games.find((game) => {
    return game.id === gameId;
  });
};

const checkGameExists = (gameId, games) => {
  return findGame(gameId, games) ? true : false;
};

const winningCombinations = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [1, 4, 7],
  [2, 5, 8],
  [3, 6, 9],
  [1, 5, 9],
  [3, 5, 7],
];

module.exports.findGame = findGame;
module.exports.checkGameExists = checkGameExists;
module.exports.winningCombinations = winningCombinations;
