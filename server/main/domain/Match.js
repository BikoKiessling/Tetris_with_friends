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
        this.access = "public";
        this.playerMaximum = 8;
        this.pointLimit = 2000;
        this.blockSequence = Array.from({length: 4096}, () => Math.floor(Math.random() * 7 + 1));
        match && Object.assign(this, match);

        this.players = [];
        this.scoreboard = new ScoreBoard();


    }

    join(player, password) {
        if (this.players.length === this.playerMaximum) return player.socket.emit("onError", "this lobby is already full!");
        if (this.access === "private" && this.password !== password) return player.socket.emit("onError", "wrong password entered!");

        this.players.push(player);
        player.setMatch(this.id);

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
        if (options && options.without) {
            builtUpdatePackage.players = builtUpdatePackage.players.filter(p => p.id !== options.without.id);
        }
        this.players.forEach((player) => {
            player.socket.emit(constants.ONMATCHUPDATE, builtUpdatePackage);
        });
    }

    checkWinCondition() {
        const players = this.players.sort((a, b) => a.score - b.score);
        if (players.filter(player => player.score >= this.pointLimit).length > 0) {
            players.slice(0, players.length - 1).forEach(player => {
                this.emitMatchUpdateAll({without: player});
                this.leave(player);
            });
        }
    }

    checkReadyState(player) {
        if (this.players.filter(player => player.ready === true).length >= this.players.length / 2) {
            this.status = status.INGAME;
            this.emitMatchUpdateAll();
            switch (this.mode) {
                case mode.SURVIVAL:
                    break;
                case mode.ELIMINATION:
                    var interval = setInterval((a) => {
                        if (this.status == status.END)
                        {
                            clearInterval(interval);
                            return;
                        }
                        //last place gets removed from game
                        const worstPlayer = a.match.players.sort((a, b) => a.score - b.score)[0];
                        a.match.emitMatchUpdateAll({"without": worstPlayer});
                        a.match.leave(worstPlayer);
                    }, this.timeout * 1000, {"match": this, "player": player});

                    break;
                case mode.SWITCH:
                    break;


            }
            return true;
        }
    }

    emitBlockSequenceUpdate(player) {
        player.playField.currentBlock += 5;
        switch (this.mode) {
            case "survival":
                //follow fixed sequences of blocks
                player.socket.emit(constants.ONBLOCKREQUEST, this.blockSequence.slice(player.playField.currentBlock, player.playField.currentBlock + 5));
                break;
            case "elimination":
                //randomize block
                player.socket.emit(constants.ONBLOCKREQUEST, [Math.floor(Math.random() * 7 + 1), Math.floor(Math.random() * 7 + 1), Math.floor(Math.random() * 7 + 1), Math.floor(Math.random() * 7 + 1), Math.floor(Math.random() * 7 + 1)]);
                break;
            case "switch":
                //randomize block
                player.socket.emit(constants.ONBLOCKREQUEST, [Math.floor(Math.random() * 7 + 1), Math.floor(Math.random() * 7 + 1), Math.floor(Math.random() * 7 + 1), Math.floor(Math.random() * 7 + 1), Math.floor(Math.random() * 7 + 1)]);
                break;
            case "race":
                player.socket.emit(constants.ONBLOCKREQUEST, this.blockSequence.slice(player.playField.currentBlock, player.playField.currentBlock + 5));
                break;
        }
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
        const players = this.players.filter(player1 => player1.id !== player.id);
        if (players.length === 0) return;
        players.sort((a, b) => b.score - a.score);
        player.socket.emit(constants.ONPLAYFIELDUPDATE, [{
            name: players[0].name,
            playField: players[0].playField.field
        },
            {
                name: players[players.length - 1].name,
                playField: players[players.length - 1].playField.field
            }]);

    }


};