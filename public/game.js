var colors = ["#ddd", "#AA3939", "#AA6C39", "#226666", "#2D882D", "#AA9E39", "#492E74", "#729C34"];
var g, b;
var blockTypes = [
  [[false, true, false], [true, true, true]],
  [[true, true], [true, true]],
  [[true], [true], [true], [true]],
  [[true, true], [false, true], [false, true]],
  [[true, true], [true, false], [true, false]],
  [[true, false], [true, true], [false, true]],
  [[false, true], [true, true], [true, false]]
];

function drawField(c, field){
  c = document.getElementById(c);
  var g = c.getContext("2d");
  var w = parseInt(c.getAttribute("width"));
  var h = parseInt(c.getAttribute("height"));
  var b = w/10;
  g.clearRect(0,0,w,h);
  for(var i = 0; i < field.length; i++){
    g.fillStyle = colors[field[i]];
    g.fillRect((i%10)*b,parseInt(i/10)*b, b,b);
  }
}

class Game {

  constructor(){
    this.time = 800;
    this.score = 0;
    this.running = false;
    this.field = [];
    this.w = 10;
    this.h = 18;
    this.timeout;
    this.blockSequence = [];
    this.mode = {};
    this.block = null;

    var row = [];
    for (var i = 0; i < 10; i++) row.push(0);
    for (var i = 0; i < 18; i++) this.field.push(JSON.parse(JSON.stringify(row)));
  }

  start(){
    this.running = true;
    this.block = new Block(this);
    this.tick();
  }

  getNextBlock(){
    if(this.blockSequence.length < 4){
      socket.emit("blockRequest");
    }
    if(this.blockSequence.length == 0){
      console.error("No next block exists!");
      return 0;
    }
    return this.blockSequence.shift();
  }
  previewNextBlock(){
    if(this.blockSequence.length == 0){
      console.error("No next preview block exists!");
      return 0;
    }
    return this.blockSequence[0];
  }

  tick() {

    game.do();

    var t = this;
    this.timeout = setTimeout(function () {
      t.tick();
    }, this.time);
  }
  
  kill(){
    this.running = false;
    clearTimeout(this.timeout);

    if(this.mode == GAMEMODE.ELIMINIATION){
      clearInterval(this.mode.tick);
    }
  }

  increaseScore(val) {
    this.score += val;
    scoreElement.innerHTML = "Score: " + this.score;
    if(val > 1000) this.time = 600;
    if(val > 2000) this.time = 500;
    if(val > 3000) this.time = 300;
    if(val > 4000) this.time = 300;
    if(val > 5000) this.time = 200;
    if(val > 6000) this.time = 100;
    socket.emit("scoreUpdate", {"score": this.score});
  }
  getField(){
    var res = [];
    for(var y = 0; y < this.h; y++)
      for(var x = 0; x < this.w; x++){
        res.push(this.field[y][x]);
      }
    for(var y = 0; y < this.block.tiles.length; y++)
      for(var x = 0; x < this.block.tiles[0].length; x++){
        if(!(this.block.tiles[y][x])) continue;
        res[(y+this.block.y)*this.w+x+this.block.x] = this.block.color;
      }
    return res;
  }
  draw() {
    g.clearRect(0, 0, this.w * b, this.h * b);
    for (var x = 0; x < this.w; x++)
      for (var y = 0; y < this.h; y++) {
        g.fillStyle = colors[this.field[y][x]];
        if(this.field[y][x] == 0 && (x+y)%2 == 0)
          g.globalAlpha = 0.8;
        else
          g.globalAlpha = 1;
        g.fillRect(x * b, y * b, b, b);
      }
    g.globalAlpha = 1;
    this.block.draw(g, b);
    socket.emit("playFieldUpdate", this.getField());
  }
  do() {
    var bottom = this.block.y + this.block.tiles.length >= this.h;
    this.block.y++;
    var collision = this.isColliding();
    this.block.y--;

    if (bottom || collision) {
      this.embedBlock();
      this.removeLines();
      this.block = new Block(this);
    } else {
      this.block.y++;
    }
    game.draw();

  }
  removeLines() {
    var winCount = 0;
    for (var y = 0; y < this.h; y++) {
      var freeSpace = false;
      for (var x = 0; x < this.w; x++) {
        freeSpace = freeSpace || (this.field[y][x] == 0);
      }
      if (!freeSpace) {
        this.field.splice(y, 1);
        var row = [];
        for (var x = 0; x < this.w; x++) row.push(0);
        this.field.unshift(row);
        winCount++;
      }
    }
    if(winCount == 1) this.increaseScore(40);
    else if(winCount == 2) this.increaseScore(100);
    else if(winCount == 3) this.increaseScore(300);
    else if(winCount == 4) this.increaseScore(1200);
  }
  isColliding() {
    var collision = false;
    for (var x = 0; x < this.block.tiles[0].length; x++)
      for (var y = 0; y < this.block.tiles.length; y++) {
        if (!this.block.tiles[y][x]) continue;
        if (y + this.block.y >= this.h) continue;
        if (!(this.field[y + this.block.y])) continue;
        collision = collision || (this.field[y + this.block.y][x + this.block.x] != 0);
      }
    return collision;
  }
  embedBlock() {
    for (var x = 0; x < this.block.tiles[0].length; x++)
      for (var y = 0; y < this.block.tiles.length; y++) {
        if (this.block.tiles[y][x]){
          if(0 <= y + this.block.y && y + this.block.y < this.h){
            this.field[y + this.block.y][x + this.block.x] = this.block.color;
          }else{
            showGameOver((match.players.length)+".","Maybe next time :)");
          }
        }
      }
  }
  goRight() {
    this.block.x++;
    if (this.block.x + this.block.tiles[0].length > this.w || this.isColliding())
      this.block.x--;
    game.draw();
  }
  goLeft() {
    this.block.x--;
    if (this.block.x < 0 || this.isColliding())
      this.block.x++;
    game.draw();
  }
  rotate() {
    this.block.tiles = rotate(this.block.tiles);
    this.goRight();
    this.goLeft();
    if (this.isColliding() || this.block.y + this.block.tiles.length >= this.h) {
      this.block.y--;
    }
    game.draw();
  }
}

function Block(game) {

  this.x = 4;
  this.y = -4;
  this.game = game;
  this.color = game.getNextBlock();
  this.tiles = blockTypes[this.color - 1];

  this.draw = function (g, b) {
    g.fillStyle = colors[this.color];
    for (var x = 0; x < this.tiles[0].length; x++)
      for (var y = 0; y < this.tiles.length; y++) {
        if (this.tiles[y][x])
          g.fillRect((this.x + x) * b, (this.y + y) * b, b, b);
      }
  }

  //preview next block
  var g = previewCanvas.getContext("2d");
  var size = 7;
  var previewBlock = this.game.previewNextBlock();

  var prev = blockTypes[previewBlock-1];
  g.clearRect(0,0, previewCanvas.getAttribute("width"), previewCanvas.getAttribute("height"));
  g.fillStyle = colors[previewBlock-1];
  
  for(var y = 0; y < prev.length; y++)
    for(var x = 0; x < prev[y].length; x++){
      if(prev[y][x])
        g.fillRect(x*size,y*size,size,size);
    }
}

function rotate(a) {
  var b = [];
  for (var x = 0; x < a[0].length; x++) {
    b.push([]);
    for (var y = a.length - 1; y >= 0; y--) {
      b[x].push([]);
    }
  }
  for (var x = 0; x < a[0].length; x++) {
    var ny = 0;
    for (var y = a.length - 1; y >= 0; y--) {
      b[x][ny] = a[y][x];
      ny++;
    }
  }
  return b;
}
function eliminationTick(){
  game.mode.timer--;
  if(timercount < 0)
    game.mode.timer = game.mode.time;
  gameinfo.innerHTML = "Next elimination: "+timercount+"s";
}

window.addEventListener("keydown", e => {
  if(game && game.running){
    if (e.which == 37) {
      game.goLeft();
    } else if (e.which == 39) {
      game.goRight();
    } else if (e.which == 40) {
      game.increaseScore(1);
      game.do();
    } else if (e.which == 38) {
      game.rotate();
    }
  }
});