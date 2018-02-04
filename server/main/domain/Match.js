const constants = require("../foundation/Constants");
const mode = require("../foundation/Mode");
const status = require("../foundation/Status");
const ScoreBoard = require("./ScoreBoard");
module.exports = class Match {

    constructor(match) {

        this.players = [];
        this.mode = mode.SURVIVAL;
        this.status = status.LOBBY;
        this.timeout = 60;
        match && Object.assign(this, match);
        this.playerMaximum = 8;
        this.players = [];
        this.access = "public";
        this.blockSequence = Array.from({length: 4096}, () => Math.floor(Math.random() * 7 + 1));

        this.scoreboard = new ScoreBoard();


    }

    join(player, password) {
        if (this.players.length === this.playerMaximum) return player.socket.emit("onError", "this lobby is already full!");
        if (this.access === "private" && this.password !== password) return player.socket.emit("onError", "wrong password entered!");

        this.players.push(player);
        player.setLobby(this.id);

        player.socket.emit(constants.ONMATCHUPDATE, this.buildUpdatePackage());
    }

    leave(player) {
        this.players = this.players.filter(player1 => player1.id !== player.id);
        player.matchId = -1;
        this.players.forEach(player1 => {
            player1.socket.emit(constants.ONMATCHUPDATE, this.buildUpdatePackage());
        });
    }

    buildUpdatePackage() {
        //emit player without socket
        const clone = Object.assign({}, this);
        delete clone.blockSequence;
        clone.players = clone.players.map(player => ({
            id: player.id,
            score: player.score,
            name: player.name,
            color: player.color,
            ready: player.ready
        }));
        return clone;
    }

    emitMatchUpdateAll(options) {
        let builtUpdatePackage = this.buildUpdatePackage();
        if(options && options.without){
            builtUpdatePackage.players = builtUpdatePackage.players.filter(p => p.id !== options.without.id);
        }
        this.players.forEach((player) => {
            player.socket.emit(constants.ONMATCHUPDATE, builtUpdatePackage);
        });
    }


    checkReadyState(player) {
        if (this.players.filter(player => player.ready === true).length >= this.players.length / 2) {
            this.status = status.INGAME;
            this.emitMatchUpdateAll();
            switch (this.mode) {
                case mode.SURVIVAL:
                    break;
                case mode.ELIMINATION:
                    setInterval((a) => {
                        //last place gets removed from game
                        const worstPlayer = a.match.players.sort((a, b) => a.score - b.score)[0];
                        a.match.emitMatchUpdateAll({"without": worstPlayer});
                        a.match.leave(worstPlayer);
                    }, this.timeout * 1000, {"match":this,"player":player});
                    break;
                case mode.SWITCH:
                    break;
            }
        }
    }

    emitNextBlock(player, playField) {
        switch (this.gamemode) {
            default:
                playField.currentBlock++;
            case "survival":
                //follow fixed sequences of blocks
                player.socket.emit("onBlockSet", match.blockSequence.indexOf(playField.currentBlock));
            case "elimination":
                //randomize block
                player.socket.emit("onBlockSet", Math.floor(Math.random() * 7 + 1));
            case "switch":
                //randomize block
                player.socket.emit("onBlockSet", Math.floor(Math.random() * 7 + 1));
        }
    }

    getPlayFields() {
        this.players.map(player => player.playfield);
    }


    emitPlayFieldUpdate(player, playFields) {
        player.socket.broadcast.emit(constants.ONPLAYFIELDUPDATE, playFields)
    }

    getVisiblePlayFields(player) {
        const players = this.players.filter(player1 => player1.id === player.id);
        players.sort((a, b) => b.score - a.score);
        this.emitPlayFieldUpdate(player, [{
            name: players[0].name,
            playField: players[0].playField
        },
            {
                name: players[players.length - 1].name,
                playField: players[players.length - 1].playField
            }]);
    }


    emitVisiblePlayFields(player) {
        const players = this.players.filter(player1 => player1.id !== player.id );
        if (players.length === 0) return;
        players.sort((a, b) => b.score - a.score);
        player.socket.emit("onLog", "my name: " + player.name + "best: " + players[0].name + "worst: " + players[players.length - 1].name);
        player.socket.emit(constants.ONPLAYFIELDUPDATE, [{
            name: players[0].name,
            playField: players[0].playField
        },
            {
                name: players[players.length - 1].name,
                playField: players[players.length - 1].playField
            }]);

    }


};