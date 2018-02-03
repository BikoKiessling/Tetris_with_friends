const constants = require("../foundation/Constants");
module.exports = class ScoreBoard {
    constructor() {
        this.scores = new Map();

    }

    updateScore(playerId, score) {
        this.scores.set(playerId, score);
        this.emitScoreBoard();
    }

    emitScoreBoard(player) {
        player.socket.broadcast.emit(constants.ONBLOCKSET,this.scores);
    }
}