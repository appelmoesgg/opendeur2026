// server/server.js
import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import ladders from "./snakesLadders.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Serve static assets (HTML, JS, CSS) from the client folder
app.use(express.static(path.join(__dirname, "..", "client")));

// Serve the game page at the root URL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "game.html"));
});

const httpServer = http.createServer(app);
const io = new Server(httpServer);

// ---------- Game state ----------
const game = {
  positions: [0, 0],   // player 1 & player 2 positions (0 = not on board yet)
  turn: 0,             // whose turn it is (0 or 1)
  sockets: []          // socket IDs in join order
};

// Reset the board (used after a win or when a player disconnects)
function resetGame() {
  game.positions = [0, 0];
  game.turn = 0;
  io.emit("reset", game.positions);
}

// Apply dice roll, snakes, and ladders
function move(pos, roll) {
  let newPos = pos + roll;
  if (newPos > 25) newPos = 25;          // stay on last square
  if (ladders[newPos]) newPos = ladders[newPos]; // snakes/ladders
  return newPos;
}

// ---------- Socket.io handlers ----------
io.on("connection", socket => {
  console.log("A client connected:", socket.id);

  // ----- Join the game -------------------------------------------------
  socket.on("joinGame", () => {
    // Keep a maximum of two players
    if (game.sockets.length < 2 && !game.sockets.includes(socket.id)) {
      game.sockets.push(socket.id);
    }
    const playerIdx = game.sockets.indexOf(socket.id);
    socket.emit("playerInfo", playerIdx);

    // Send current board state to the newly joined client
    socket.emit("diceResult", {
      roll: 0,
      positions: [...game.positions]
    });
  });

  // ----- Request current state -----------------------------------------
  socket.on("requestState", () => {
    socket.emit("diceResult", {
      roll: 0,
      positions: [...game.positions]
    });
  });

  // ----- Roll dice ------------------------------------------------------
  socket.on("rollDice", () => {
    const playerIdx = game.sockets.indexOf(socket.id);
    if (playerIdx !== game.turn) {
      // Not this player's turn – ignore the request
      return;
    }

    // Server‑side dice roll (1‑6)
    const roll = Math.ceil(Math.random() * 6);

    // Update the player's position (including snakes/ladders)
    game.positions[playerIdx] = move(game.positions[playerIdx], roll);

    // Advance turn to the next player
    game.turn = (game.turn + 1) % game.sockets.length;

    // Broadcast the result to everyone
    io.emit("diceResult", {
      roll,
      positions: [...game.positions]
    });
  });

  // ----- Reset after a win ---------------------------------------------
  socket.on("resetGame", () => {
    resetGame();
  });

  // ----- Disconnect handling --------------------------------------------
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    const idx = game.sockets.indexOf(socket.id);
    if (idx !== -1) {
      game.sockets.splice(idx, 1);
      // Reset the game so the remaining player can start fresh
      resetGame();
    }
  });

  // ----- Simple ping/pong (kept from earlier scaffold) -----------------
  socket.on("ping", data => {
    socket.emit("pong", { timestamp: data.timestamp });
  });
});

// ---------- Start server ----------
httpServer.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});