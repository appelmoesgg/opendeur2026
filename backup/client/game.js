function gameSetup(){
  // Load sprites
  let sprites = ["1.png", "2.png", "3.png", "4.png", "5.png", "6.png", "blauwepion.png", "gelepion.png", "groenepion.png", "rodepion.png", "Rolknop.png", "background.png", "Titel.png", "unrolled.png"]
  for (const sprite of sprites) {
    var img = document.createElement("img");
    img.src = `assets/${sprite}`;
    img.id = sprite.replace(".png", "")
    var src = document.getElementById("sprites");
    src.appendChild(img);
  }

  game()
}

function game() {
  requestAnimationFrame(game)

  const canvas = document.getElementById("game");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const ctx = canvas.getContext("2d")
  drawBG(ctx, canvas)
  drawPion(ctx, canvas, "rode")
}

function drawBG(ctx, canvas){
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(document.getElementById("background"), 0, 0, canvas.width, canvas.height);
}

function drawPion(ctx, canvas, color){
  ctx.strokeStyle = "red"
  ctx.lineWidth = 1;
  ctx.drawImage(document.getElementById(`${color}pion`), 0, 0, 32, 32)
}


window.onload = (ev) => {gameSetup()}