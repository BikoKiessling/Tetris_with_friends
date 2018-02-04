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

app.use(express.static("public"));
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
        server.createMatch(new Match(matchData), player);

        //update list of other players
        server.emitMatchListUpdate(player, true);
    });


    player.socket.on(constants.JOINMATCH, (matchData) => {
        const match = server.getMatch(matchData.id);
        if (!match) return;
        switch (match.access) {
            case "public":
                match.join(player);
                break;
            case "private":
                match.join(player, match.password);
                break;

        }
        match.emitMatchUpdateAll();
    });

    player.socket.on(constants.READYSTATECHANGE, (data) => {
        const match = server.getMatch(player.matchId);
        if (match.players === 1) return player.socket.emit("onWarning", "You cannot start a game by yourself!");
        player.ready = data.ready;

        //inform all about "ready" state
        match.emitMatchUpdateAll();
        //transition into ingame state
        if (match.checkReadyState(player)) server.emitMatchListUpdate(player, true);
    });

    player.socket.on(constants.LEAVEMATCH, () => {
        const match = server.getMatch(player.matchId);
        if (!match) return;
        match.leave(player);
        server.emitMatchListUpdate(player, true);

        if (match.players.length === 0) {
            server.deleteMatch(match.id);
            server.emitMatchListUpdate(null, true);
        }
    });

    player.socket.on("scoreUpdate", score => {
        if (player.matchId == -1) return;
        const match = server.getMatch(player.matchId);
        player.score = score.score;
        if (match.mode === "race") match.checkWinCondition();
        match.emitMatchUpdateAll();
    });

    player.socket.on(constants.DISCONNECT, () => {
        if (player.matchId !== -1) {
            const match = server.getMatch(player.matchId);
            match.leave(player);
            if (match.players.length === 0) {
                server.deleteMatch(match.id);
                server.emitMatchListUpdate(null, true);
            }
        }
        server.leave(player);

    });
    player.socket.on(constants.BLOCKREQUEST, () => {
        const match = server.getMatch(player.matchId);
        if (!match) return;
        console.log("block set: ");

        server.getMatch(player.matchId).emitBlockSequenceUpdate(player);
    });

    player.socket.on(constants.PLAYFIELDUPDATE, playField => {
        if (player.matchId === -1) return;
        console.log("playfield update: " + playField);
        player.playField.field = playField;
        const match = server.getMatch(player.matchId);
        if (match) match.emitVisiblePlayFields(player);
    });

})
;


