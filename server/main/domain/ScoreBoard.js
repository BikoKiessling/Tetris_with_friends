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

    getRanking(playerId)
    {//sort ascending
      return [...scores].sort((a,b) => a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0).filter(player=>player.id === playerId)[0].score;
    }

}