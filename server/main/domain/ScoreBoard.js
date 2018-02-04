const constants = require("../foundation/Constants");
module.exports = class ScoreBoard {
    constructor() {
        this.scores = new Map();

    }

    updateScore(player, score) {
        this.scores.set(player.id, score);
        this.emitScoreUpdate(player);
    }

    emitScoreUpdate(player) {
        player.socket.broadcast.emit(constants.ONSCOREUPDATE,this.scores);
    }

}