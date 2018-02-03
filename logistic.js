var socket, name;
var ip = "http://192.168.43.87:8080/";
var state = "start";
var ready = false;

window.addEventListener("DOMContentLoaded", e => {

  socket = io(ip);
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
      content += "<li onclick='joinMatch("+match[id].id+")'>";
      content += "<span class='name'>"+match[id].name+"</span>";
      content += "<span class='mode'>"+match[id].mode+"</span>";
      content += "<span class='access'>"+match[id].access+"</span>";
      content += "</li>";
    }
    games.innerHTML = content;
    registered.style.display = "block";
  });

  socket.on("onMatchUpdate", function(match){
    console.log("update",match);
    if(match.state != window.state){
      var sections = document.querySelector("section");
      for(var i = 0; i < sections.length; i++)
        sections[i].style.display = "none";
      if(match.state == "lobby") 
        sectionLobby.style.display="block";
      else if(match.state == "ingame") 
        sectionIngame.style.display="block";
    }

    if(match.state == "lobby"){
      content = "";
      for(var i = 0; i < match.players; i++){
        content += "<li data-ready='"+ (match.players[i].ready?"true":"false") +"'>" + match.players[i].name + "</li>";
      }
      players.innerHTML = content;
    }

    if(match.state == "ingame"){
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
  socket.emit("joinMatch",{"id":id});
}