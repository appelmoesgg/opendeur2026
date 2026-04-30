function game() {
  requestAnimationFrame(game)

  const canvas = document.getElementById("game");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let ctx = canvas.getContext("2d");
  drawBoard(canvas,5,5);
}


window.onload = (ev) => {game()}