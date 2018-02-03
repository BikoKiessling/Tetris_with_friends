
function gameTick(){

  var g = myCanvas.getContext("2d");
  var b = 20;
  var w = 10;
  var h = 18;

  g.clearRect(0,0,w*b,h*b);



  setTimeout(gameTick, 800);
}
gameTick();

function Game(){

  this.block = new Block();
  this.field = [];
  this.w = 10;
  this.h = 18;
  this.draw = function(g, b){
    for(var x = 0; x < this.w; x++)
      for(var y = 0; y < this.h; y++){
        
      }
  }

  var row = [];
  for(var i = 0; i < 10; i++) row.push([]);
  for(var i = 0; i < 18; i++) this.field.push(row);
}
function Block(){
  
  this.blockTypes = [
    [[false,true,false],[true,true,true]],
    [[true,true],[true,true]],
    [[true],[true],[true],[true]],
    [[true,true],[false,true],[false,true]],
    [[true,true],[true,false],[true,false]],
    [[true,false],[true,true],[false,true]],
    [[false,true],[true,true],[true,false]]
  ];
  this.tiles = this.blockTypes[parseInt(Math.random()*this.blockTypes.length)];
}