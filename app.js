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
    const player = new Player(socket);

    console.log("player connected " + player.id);

    //game management handlers
    player.socket.on(constants.REGISTER, playerData => {
        console.log("register: ", playerData);
        player.assignFields(playerData);
        server.registerPlayer(player);
    });


    player.socket.on(constants.CREATEMATCH, (matchData) => {
        console.log("create match: " + matchData);
        server.createMatch(new Match(matchData, player));

        //update list of other players
        server.emitMatchListUpdate(player, true);
    });


    player.socket.on(constants.JOINMATCH, (matchData) => {
        const match = server.getMatch(matchData.id);
        switch (match.access) {
            case "public":
                match.join(player);
                break;
            case "private":
                match.join(player, match.password);
        }
    });

    player.socket.on(constants.READYSTATECHANGE, (state) => {
        player.ready = state
    });


    player.socket.on(constants.LEAVEMATCH, match => {
        server.getMatch(match.id).leave(player);
    });

    player.socket.on(constants.SCOREUPDATE, score => {
        const scoreBoard = server.getMatch(player.currentLobby).getScoreBoard();
        scoreBoard.updateScore(score);
        scoreBoard.emitScoreBoard(player.socket.broadcast);
    });

    player.socket.on(constants.BLOCKSET, playField => {
        server.getMatch(player.currentLobby).emitNextBlock(playField);
    });


// socket.socket.emit("onPlayFieldUpdate",
//     server.getMatch(this.player.currentLobby).getVisiblePlayFields(this.player.id));


})
;


