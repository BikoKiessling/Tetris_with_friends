var socket, name;
var ip = "http://192.168.43.87:8080/";
var status = "start";
var ready = false;

window.addEventListener("DOMContentLoaded", e => {

  socket = io(ip);
  test();
  socket.on('connect', function(){
    console.log("connected");
    loggedin.style.display = "block";
    connecting.style.display = "none";
  });
  
  socket.on('onMatchListUpdate', function(matchlist){
    console.log("updatelist",matchlist);
    var content = "";
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

  socket.on("onMatchUpdate", function(match){
    console.log("update",match);
    if(match.status != window.status){
      var sections = document.querySelectorAll("section");

      for(var i = 0; i < sections.length; i++)
        sections[i].style.display = "none";

      if(match.status == "lobby"){
        sectionLobby.style.display="block";

      }else if(match.status == "ingame"){
        sectionIngame.style.display="block";
        g = myCanvas.getContext("2d")
        b = 30;
        game = new Game();
        game.tick();
      }
    }

    if(match.status == "lobby"){
      content = "";
      for(var i = 0; i < match.players.length; i++){
        content += "<li data-ready='"+ (match.players[i].ready?"true":"false") +"'>" + match.players[i].name + "</li>";
      }
      players.innerHTML = content;
      matchName.innerHTML = "Lobby: "+match.name;
    }

    if(match.status == "ingame"){
      match.players.sort(function(a,b) {
        return a.score - b.score;
      });
      content = "";
      for(var i = 0; i < match.players; i++){
        content += "<li>" + (i+1) + ". " + match.players[i].name + " (" + match.players[i].score + ")</li>";
      }
      leaderboard.innerHTML = content;
    }
  });
  
  socket.on("onPlayFieldUpdate", function(data){

    // TODO update

  });

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
  console.log("want to joinMatch",id);
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