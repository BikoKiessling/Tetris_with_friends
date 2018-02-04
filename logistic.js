var socket, name = null;
var ip = "http://192.168.43.87:8080/";
var status = "start";
var ready = false;

// let's get going
window.addEventListener("DOMContentLoaded", e => {

  //establish websocket connection
  socket = io(ip);

  //if connected, show login mask
  socket.on('connect', function(){
    console.info("connected");
    loggedin.style.display = "block";
    connecting.style.display = "none";
  });
  
  //updates on availables games
  socket.on('onMatchListUpdate', function(matchlist){
    if(name == null) return;
    var content = "";
    console.log("updatelist",matchlist);
    for(var i = 0; i < matchlist.length; i++){
      var match = matchlist[i];
      content += "<tr onclick='joinMatch("+match.id+")'>";
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
    if(match.status != window.status){
      var sections = document.querySelectorAll("section");

      //disable all sections
      for(var i = 0; i < sections.length; i++)
        sections[i].style.display = "none";

      //enable single sections
      if(match.status == "lobby"){
        sectionLobby.style.display="block";
      }else if(match.status == "ingame"){
        //start game
        sectionIngame.style.display="block";
        g = myCanvas.getContext("2d")
        b = 30;
        game = new Game();
        game.tick();
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
    }
  });
  
  //when playfield received, show them in sections
  socket.on("onPlayFieldUpdate", function(data){

    console.log("onPlayFieldUpdate", data);
    bestName.innerHTML = data[0].name;
    worstName.innerHTML = data[1].name;
    drawField("bestCanvas", data[0].playField);
    drawField("worstCanvas", data[1].playField);

  });

  //disconnect
  socket.on('disconnect', function(){
    console.log("disconnect");
  });
});

function onReadyStateChange(){
  ready = !ready;
  readyButton.innerHTML = (ready?"not ready":"ready");
  socket.emit("readyStateChange", {"ready":ready});
}
function register(name){
  window.name = name;
  socket.emit("register", {"name":name});
  console.log("register", {"name":name});
}
function openCreateDialog(){
  createDialog.style.display = "block";
  dialogOverlay.style.display = "block";
}
function closeCreateDialog(){
  createDialog.style.display = "none";
  dialogOverlay.style.display = "none";
}
function createMatch(name,password,mode){
  socket.emit("createMatch",{
    "name": name,
    "password": password,
    "access": (password==""),
    "mode":"survival"
  });
}
function joinMatch(id){
  socket.emit("joinMatch",{"id":id});
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