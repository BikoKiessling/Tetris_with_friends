var socket, name = null, game, match;
var registeredBool = false, id, timercount, blockSeq =[];
var ip = ":8080/";
var status = "start";
var ready = false;

// let's get going
window.addEventListener("DOMContentLoaded", e => {

  //establish websocket connection
  socket = io(ip);

  //if connected, show login mask
  socket.on('connect', function(){
    console.info("Connection etablished.");
    loggedin.style.display = "block";
    connecting.style.display = "none";
  });

  //updates on availables games
  socket.on('onLog', function(str){
    console.log("Server Log",str);
  });
  //updates on availables games
  socket.on('onError', function(str){
    console.error("Server Error",str);
  });
  //updates on availables games
  socket.on('onBlockRequest', function(array){
    for(var i = 0; i < array.length; i++){
      blockSeq.push(array[i]);
    }
  });

  //updates on availables games
  socket.on('onRegister', function(id){
    window.id = id;
  });
  
  //updates on availables games
  socket.on('onMatchListUpdate', function(matchlist){
    if(!registeredBool) return;
    var content = "";
    for(var i = 0; i < matchlist.length; i++){
      var match = matchlist[i];
      content += "<tr onclick='join"+(match.access=="private"?"Private":"")+"Match("+match.id+")' data-lobby='"+(match.status=="lobby"?"true":"false")+"'>";
      content += "<td class='name'>"+match.name+"</td>";
      content += "<td class='mode'>"+match.mode+"</td>";
      content += "<td class='access'>"+match.access+"</td>";
      content += "</tr>";
    }
    games.innerHTML = content;
    registered.style.display = "block";
  });

  //updates on a match
  socket.on("onMatchUpdate", function(match){

    //status change
    console.log("update",match);
    window.match = match;
    if(match.status != window.status){
      var sections = document.querySelectorAll("section");

      //disable all sections
      for(var i = 0; i < sections.length; i++)
        sections[i].style.display = "none";

      //enable single sections
      if(match.status == "lobby"){
        sectionLobby.style.display="block";
        socket.emit("blockRequest");
      }else if(match.status == "ingame"){
        //start game
        sectionIngame.style.display="block";
        g = myCanvas.getContext("2d")
        b = 30;
        game = new Game();
        game.tick();
        if(match.mode == "elimination"){
          timercount = 60;
          setTimeout(function(){eliminationTick();}, 1000);
        }else if(match.mode == "race"){
          timer.innerHTML = "reach 2000 points";
        }
      }
      window.status = match.status;
    }

    //when in lobby: update player list
    if(match.status == "lobby"){
      content = "";
      for(var i = 0; i < match.players.length; i++){
        content += "<li data-ready='"+ (match.players[i].ready?"true":"false") +"'>" + match.players[i].name + "</li>";
      }
      players.innerHTML = content;
      matchName.innerHTML = "Lobby: "+match.name;
    }

    //when in game: update leaderboard
    if(match.status == "ingame"){
      match.players.sort(function(a,b) {
        return b.score - a.score;
      });
      var content = "";
      for(var i = 0; i < match.players.length; i++){
        content += "<li>" +  match.players[i].name + " (" + match.players[i].score + ")</li>";
      }
      leaderboardElement.innerHTML = content;

      //game over check
      var gameOver = true;
      for(var i = 0; i < match.players.length; i++)
        if(match.players[i].id == id)
          gameOver = false;
      if(gameOver){
        showGameOver((match.players.length+1)+".","You lost..");
      }

      //win check
      if(match.players.length <= 1 && !gameOver){
        showGameOver("Good job","You won!");
      }
    }
  });
  
  //when playfield received, show them in sections
  socket.on("onPlayFieldUpdate", function(data){

    bestName.innerHTML = data[0].name;
    worstName.innerHTML = data[1].name;
    drawField("bestCanvas", data[0].playField);
    drawField("worstCanvas", data[1].playField);

  });

  //disconnect
  socket.on('disconnect', function(){
    console.log("Disconnect.");
  });
});

function onReadyStateChange(){
  ready = !ready;
  readyButton.innerHTML = (ready?"not ready":"ready");
  socket.emit("readyStateChange", {"ready":ready});
}
function register(name){
  window.name = name;
  registeredBool = true;
  loggedin.style.display = "none";
  socket.emit("register", {"name":name});
}
function openCreateDialog(){
  createDialog.style.display = "block";
  dialogOverlay.style.display = "block";
}
function closeCreateDialog(){
  createDialog.style.display = "none";
  dialogOverlay.style.display = "none";
}
function leaveLobby(){
  socket.emit("leaveMatch");
  sectionLobby.style.display = "none";
  sectionStart.style.display = "block";
  window.status = "start";
}
function createMatch(name,password,mode){
  socket.emit("createMatch",{
    "name": name,
    "password": password,
    "access": (password=="")?"public":"private",
    "mode":mode
  });
}
function joinMatch(id){
  socket.emit("joinMatch",{"id":id});
}
function joinPrivateMatch(id){
  var pw = window.prompt("Please enter the password");
  socket.emit("joinMatch",{"id":id,"password":pw});
}

function test(){
  
  var sections = document.querySelectorAll("section");

  for(var i = 0; i < sections.length; i++)
    sections[i].style.display = "none";
  sectionIngame.style.display="block";
  g = myCanvas.getContext("2d")
  b = 30;
  game = new Game();
  game.tick();
  
}
function showGameOver(s1,s2){
  sectionIngame.style.display = "none";
  sectionEnd.style.display = "block";
  heading.innerHTML = s1;
  subheading.innerHTML = s2;
  clearTimeout(game.timeout);
  game = null;
}
function toFront(){
  sectionEnd.style.display = "none";
  sectionStart.style.display = "block";
  socket.emit("leaveMatch");
  window.status = "start";
}