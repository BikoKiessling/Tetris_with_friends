const constants = require("../foundation/Constants");
const mode = require("../foundation/Mode");
const status = require("../foundation/Status");
const ScoreBoard = require("./ScoreBoard");
module.exports = class Match {

    constructor(match) {

        match && Object.assign(this, match);
        this.playerMaximum = 8;
        this.players = [];
        this.access = "public";
        this.blockSequence = Array.from({length: 4096}, () => Math.floor(Math.random() * 7 + 1));
        this.players = [];
        this.mode = mode.SURVIVAL;
        this.status = status.LOBBY;

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
        this.players.forEach(player1 => {
            player1.socket.emit(constants.ONMATCHUPDATE, this.buildUpdatePackage());
        })
    }

    buildUpdatePackage() {
        //emit player without socket
        const clone = Object.assign({}, this);
        clone.players = clone.players.map(player => ({
            id: player.id,
            score: player.score,
            name: player.name,
            color: player.color,
            ready: player.ready
        }));
        return clone;
    }

    emitMatchUpdateBroadcast(player) {
        const builtUpdatePackage = this.buildUpdatePackage();
        player.socket.broadcast.emit(constants.ONMATCHUPDATE, builtUpdatePackage);
        player.socket.emit(constants.ONMATCHUPDATE, builtUpdatePackage);
    }

    emitMatchUpdateAll(player)
    {
        player.socket.emit(constants.ONMATCHUPDATE, this.buildUpdatePackage());
    }


    checkReadyState(player) {
        if (this.players.filter(player => player.ready === true).length >= this.players.length / 2) {
            this.status = status.INGAME;
            this.emitMatchUpdateBroadcast(player);
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

    getVisiblePlayFields(playerId) {
        const playFields = this.getPlayFields();
        if (playFields <= 3) return playFields;

        switch (playerId) {
            //user in first place
            case playFields[0].owner:
                return [playFields[1], playFields[playFields.length - 1]];
            //user in last place
            case playFields[playFields.length - 1].owner:
                return [playFields[0], playFields[playFields.length - 2]];
            default:
                return [playFields[0], playFields[playFields.length - 1]];

        }
    }


};