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
        this.emitPlayerId(player);
    }

    createMatch(match,player) {
        match.id=this.matches.push(match)-1;
        match.join(player);
    }

    getMatch(matchId) {
        return this.matches.filter((match) => match.id === matchId)[0];
    }
    deleteMatch(matchId){
       this.matches = this.matches.filter((match) => match.id !== matchId);
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

    emitPlayerId(player)
    {
        player.socket.emit(constants.ONREGISTER,player.id);
    }
    emitMatchListUpdate(player, broadcast) {
        switch (broadcast) {
            case true:
                const matchList = this.getMatches();
                this.players.forEach(function(player){
                    player.socket.emit(constants.ONMATCHLISTUPDATE, matchList);
                });
                break;
            default:
                player.socket.emit(constants.ONMATCHLISTUPDATE, this.getMatches());
        }

    }

    leave(player) {
        this.players=this.players.filter(player1 => player1.id !== player.id);

    }

};