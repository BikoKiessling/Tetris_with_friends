const constants = require("../foundation/Constants");
//initialize basic variables
module.exports = class Server {

    constructor() {
        this.players = [];
        this.matches = [];

    }

    registerPlayer(player) {
        //add element to array and set id to proper array position
        player.id = this.players.push(player) - 1;
    }

    createMatch(match) {
        this.matches.push(match);
    }

    getMatch(matchId) {
        return this.matches.filter((match) => match.id === matchId);
    }

    getMatches() {
        return this.matches;
    }

    emitMatchListUpdate(player, broadcast) {
        switch (broadcast) {
            case true:
                player.socket.broadcast.emit(constants.ONMATCHLISTUPDATE, this.getMatches());
                break;
            default:
                player.socket.emit(constants.ONMATCHLISTUPDATE, this.getMatches());
        }

    }


    leave(player) {
        if (player.currentLobby === -1) player.emit("onWarning", "You are in no lobby!");
        player.currentLobby = -1;

        //remove player by id;
        const index = this.players.map(function (player) {
            return player.id;
        }).indexOf(player.id);
        this.players.splice(index, 1);
    }

};