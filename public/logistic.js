var socket, connection = {}, game, match = {};
var ip = (localStorage.getItem("ip")) || ":8080/";
var status = "start";
var ready = false;

function setUI(str) {
  document.body.className = str;
}

// let's get going
window.addEventListener("DOMContentLoaded", e => {

  //establish websocket connection
  socket = io(ip);

  //if connected, show login mask
  socket.on('connect', function () {
    console.info("Connection etablished.");
    setUI(UI.START);
  });

  //updates on availables games
  socket.on('onLog', function (str) {
    console.log("Server Log", str);
  });
  //updates on availables games
  socket.on('onError', function (str) {
    console.error("Server Error", str);
  });
  //updates on availables games
  socket.on('onBlockRequest', function (array) {
    array.forEach(element => {
      game.blockSequence.push(element);
    });
  });

  //updates on availables games
  socket.on('onRegister', function (id) {
    connection.id = id;
    connection.registered = true;
    setUI(UI.GAMES);
  });

  //updates on availables games
  socket.on('onMatchListUpdate', function (matchlist) {
    //TODO 
    // SERVER BUG
    // first onRegister, second onMatchListUpdate
    //if(connection.registered) return;
    console.log("matchlist", matchlist);

    var content = "";
    for (var i = 0; i < matchlist.length; i++) {
      var match = matchlist[i];
      content += "<tr onclick='join" + (match.access == "private" ? "Private" : "") + "Match(" + match.id + ")' data-lobby='" + (match.status == "lobby" ? "true" : "false") + "'>";
      content += "<td class='name'>" + match.name + "</td>";
      content += "<td class='mode'>" + match.mode + "</td>";
      content += "<td class='access'>" + match.access + "</td>";
      content += "</tr>";
    }
    gameList.innerHTML = content;
  });

  //updates on a match
  socket.on("onMatchUpdate", function (match) {

    //status change
    console.log("update", match,window.match);
    if (match.status != window.match.status) {

      //enable single sections
      if (match.status == "lobby") {
        setUI(UI.LOBBY);
        ready = true;
        onReadyStateChange();
        game = new Game();
        socket.emit("blockRequest");
      } else if (match.status == "ingame") {
        //start game
        setUI(UI.INGAME);
        g = myCanvas.getContext("2d")
        b = 30;
        game.mode = { type: match.mode };
        if (game.mode === GAMEMODE.ELIMINIATION) {
          game.mode.timer = 60;
          game.mode.time = 60;
          game.mode.tick = setInterval(function () { eliminationTick(); }, 1000);
          gameinfo.innerHTML = "Survive every minute!";
        } else if (game.mode === GAMEMODE.RACE) {
          gameinfo.innerHTML = "Reach 2000 points";
        }
        game.start();
      }
      window.match = match;
    }

    //when in lobby: update player list
    if (match.status == "lobby") {
      content = "";
      for (var i = 0; i < match.players.length; i++) {
        content += "<li data-ready='" + (match.players[i].ready ? "true" : "false") + "'>" + match.players[i].name + "</li>";
      }
      players.innerHTML = content;
      matchName.innerHTML = match.name;
    }

    //when in game: update leaderboard
    if (match.status == "ingame") {
      match.players.sort(function (a, b) {
        return b.score - a.score;
      });
      var content = "";
      for (var i = 0; i < match.players.length; i++) {
        content += "<li>" + match.players[i].name + " (" + match.players[i].score + ")</li>";
      }
      leaderboardElement.innerHTML = content;

      //game over check
      var gameOver = true;
      for (var i = 0; i < match.players.length; i++)
        if (match.players[i].id == connection.id)
          gameOver = false;
      if (gameOver) {
        showGameOver((match.players.length + 1) + ".", "You lost..");
      }

      //win check
      if (match.players.length <= 1 && !gameOver) {
        showGameOver("Good job", "You won!");
      }
    }
    window.match = match;
  });

  //when playfield received, show them in sections
  socket.on("onPlayFieldUpdate", function (data) {
    bestName.innerHTML = data[0].name;
    worstName.innerHTML = data[1].name;
    drawField("bestCanvas", data[0].playField);
    drawField("worstCanvas", data[1].playField);

  });

  //disconnect
  socket.on('disconnect', function () {
    console.log("Disconnect.");
    setUI(UI.DISCONNECTED);
  });
});

function onReadyStateChange() {
  ready = !ready;
  readyButton.innerHTML = (ready ? "not ready" : "ready");
  socket.emit("readyStateChange", { "ready": ready });
}
function register(name) {
  connection.name = name;
  connection.registered = true;
  setUI(UI.GAMES);
  socket.emit("register", { "name": name });
}
function openCreateDialog() {
  setUI(UI.CREATED);
}
function closeCreateDialog() {
  setUI(UI.GAMES);
}
function leaveMatch() {
  setUI(UI.GAMES);
  socket.emit("leaveMatch");
  ready = false;
  match = null;
  readyButton.innerHTML = "ready";
  players.innerHTML = "";
}
function createMatch(name, password, mode) {
  socket.emit("createMatch", {
    "name": name,
    "password": password,
    "access": (password == "") ? "public" : "private",
    "mode": mode
  });
}
function joinMatch(id) {
  socket.emit("joinMatch", { "id": id });
}
function joinPrivateMatch(id) {
  var pw = window.prompt("Please enter the password");
  socket.emit("joinMatch", { "id": id, "password": pw });
}

function showGameOver(s1, s2) {
  leaveMatch();
  setUI(UI.END);
  heading.innerHTML = s1;
  subheading.innerHTML = s2;
  game.kill();
}