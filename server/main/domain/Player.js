const EventEmitter = require('events');
const PlayField = require("./PlayField");
var io = require('socket.io');

module.exports = class Player {

    constructor(socket) {
        this.socket = socket;

        //create random color HEX code
        this.color = "#" + ((1 << 24) * Math.random() | 0).toString(16);
        this.ip = socket.handshake.address;
        this.matchId = -1;
        this.ready = false;
        this.score=0;
        this.playField = new PlayField(this.id);
    }

    //set the values entered by the user
    assignFields(player) {
        this.name = player.name;
    }

    setMatch(matchId) {
        this.matchId = matchId;
    }

};

