var colors = ["#000", "red", "yellow", "blue", "green", "orange", "purple", "lightblue"];
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

function increaseScore(val) {
  score += val;
  socket.emit("updateScore", { "score": score });
}
window.addEventListener("DOMContentLoaded", function () {
  g = myCanvas.getContext("2d")
  b = 20;
  game = new Game();
  game.tick();
});

function drawField(c, field){
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

function Game() {

  this.time = 800;
  this.score = 0;
  this.running = true;
  this.block = new Block();
  this.field = [];
  this.w = 10;
  this.h = 18;

  this.tick = function () {

    var w = 10;
    var h = 18;

    g.clearRect(0, 0, w * b, h * b);
    game.do();

    var t = this;
    if (this.running)
      setTimeout(function () {
        t.tick();
      }, 800);
  }
  this.increaseScore = function (val) {
    this.score += val;
    scoreElement.innerHTML = "Score: " + this.score;
    //socket.emit("scoreUpdate", {"score": this.score});
  }
  this.draw = function () {
    for (var x = 0; x < this.w; x++)
      for (var y = 0; y < this.h; y++) {
        g.fillStyle = colors[this.field[y][x]];
        g.fillRect(x * b, y * b, b, b);
      }
    this.block.draw(g, b);
  }
  this.do = function () {
    var bottom = this.block.y + this.block.tiles.length >= this.h;
    this.block.y++;
    var collision = this.isColliding();
    this.block.y--;

    if (bottom || collision) {
      this.embedBlock();
      this.removeLines();
      this.block = new Block();
    } else {
      this.block.y++;
    }
    game.draw();

  }
  this.removeLines = function () {
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
        this.increaseScore(40);
      }
    }
  }
  this.isColliding = function () {
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
  this.embedBlock = function () {
    for (var x = 0; x < this.block.tiles[0].length; x++)
      for (var y = 0; y < this.block.tiles.length; y++) {
        if (this.block.tiles[y][x]){
          if(0 <= y + this.block.y && y + this.block.y < this.h)
            this.field[y + this.block.y][x + this.block.x] = this.block.color;
            else{
              this.running = false;
              // FINISHED
            }
        }
      }
  }
  this.goRight = function () {
    this.block.x++;
    if (this.block.x + this.block.tiles[0].length > this.w || this.isColliding())
      this.block.x--;
    game.draw();
  }
  this.goLeft = function () {
    this.block.x--;
    if (this.block.x < 0 || this.isColliding())
      this.block.x++;
    game.draw();
  }
  this.rotate = function () {
    this.block.tiles = rotate(this.block.tiles);
    this.goRight();
    this.goLeft();
    if (this.isColliding() || this.block.y + this.block.tiles.length >= this.h) {
      this.block.y--;
    }
    game.draw();
  }

  var row = [];
  for (var i = 0; i < 10; i++) row.push(0);
  for (var i = 0; i < 18; i++) this.field.push(JSON.parse(JSON.stringify(row)));
}
function Block() {

  this.x = 4;
  this.y = -4;

  this.color = 1 + parseInt(Math.random() * blockTypes.length);
  this.tiles = blockTypes[this.color - 1];

  this.draw = function (g, b) {
    g.fillStyle = colors[this.color];
    for (var x = 0; x < this.tiles[0].length; x++)
      for (var y = 0; y < this.tiles.length; y++) {
        if (this.tiles[y][x])
          g.fillRect((this.x + x) * b, (this.y + y) * b, b, b);
      }
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

window.addEventListener("keydown", e => {
  if (e.which == 37) {
    game.goLeft();
  } else if (e.which == 39) {
    game.goRight();
  } else if (e.which == 40) {
    if(game.running)
      game.increaseScore(1);
    game.do();
  } else if (e.which == 38) {
    game.rotate();
  }
});