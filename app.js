const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const constants = require("./server/main/foundation/Constants");
const Server = require("./server/main/domain/Server");
const Match = require("./server/main/domain/Match");
const Player = require("./server/main/domain/Player");

//init server
const server = new Server();

http.listen(8080, function () {
    console.log('listening on *:' + 8080);
});

io.on('connection', function (socket) {

    //configure player
    this.player = new Player(socket);

    console.log("player connected " + this.player.id);

    //game management handlers
    this.player.socket.on(constants.REGISTER, player => {
        console.log("register: ", player);
        this.player.assignFields(player);
        server.registerPlayer(this.player);
        server.emitMatchListUpdate(this.player);
    });


    this.player.socket.on(constants.CREATEMATCH, (match) => {
        console.log("create match: " + match);
        server.createMatch(new Match(match, this.player));

        //update list of other players
        server.emitMatchListUpdate(this.player,true);
    });


    this.player.socket.on(constants.JOINMATCH, (match) => {
        server.getMatch(match.id).join(player, match.password);
    });


    this.player.socket.on(constants.READYSTATECHANGE, (state) => {
        player.ready = state
    });


    this.player.socket.on(constants.LEAVEMATCH, match => {
        server.getMatch(match.id).leave(player);
    });

    this.player.socket.on(constants.SCOREUPDATE, score => {
        const scoreBoard = server.getMatch(this.player.currentLobby).getScoreBoard();
        scoreBoard.updateScore(score);
        scoreBoard.emitScoreBoard(this.player.socket.broadcast);
    });

    this.player.socket.on(constants.BLOCKSET, playField => {
        server.getMatch(this.player.currentLobby).emitNextBlock(playField);
    });

    // socket.socket.emit("onPlayFieldUpdate",
    //     server.getMatch(this.player.currentLobby).getVisiblePlayFields(this.player.id));


});


