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
        this.emitMatchListUpdate(player);
    }

    createMatch(match,player) {
        match.id=this.matches.push(match)-1;
        match.join(player);
    }

    getMatch(matchId) {
        return this.matches.filter((match) => match.id === matchId)[0];
    }


    getMatches() {
        return this.matches.map(match => {
            const clone = Object.assign({}, match);
            clone.players = match.players.map(player => ({
                id: player.id,
                score: player.score,
                name: player.name,
                color:player.color,
                ready:player.ready
            }));
            return clone;
        });
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
        // const index = this.players.map(function (player) {
        //     return player.id;
        // }).indexOf(player.id);
        // this.players.splice(index, 1);
        this.players=this.players.filter(player1 => player1.id !== player.id);


    }

};