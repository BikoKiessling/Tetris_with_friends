const constants = require("../foundation/Constants");
const gameMode = require("../foundation/GameMode");
const status = require("../foundation/Status");
module.exports = class Match {

    constructor(match, player) {

        match && Object.assign(this, match);
        this.playerMaximum = 8;
        this.players = [];
        this.access = "public";
        this.blockSequence = Array.from({length: 4096}, () => Math.floor(Math.random() * 7 + 1));
        this.players = [];
        this.join(player);
        this.gameMode = gameMode.SURVIVAL;
        this.status = status.LOBBY;

    }

    join(player, password) {
        if (this.players.length === this.playerMaximum) return player.emit("onError", "this lobby is already full!");
        if (this.password === password) return player.emit("onError", "wrong password entered!");

        this.players.push(player);
        player.setLobby(this.id);

        //emit player without socket
        const clone = Object.assign({}, this);
        clone.players = clone.players.map(player => {
            player.id, player.name, player.color.player.score, player.ready
        });

        player.socket.emit(constants.ONMATCHUPDATE, clone);
    }

    emitNextBlock(playField) {
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