import { Server } from 'socket.io';
import { Game } from './src/lib/game/Game';

let gameInstance: Game = new Game();
let colors: string[] = ['red', 'blue', 'green', 'yellow'];
let countdownStarted: boolean = false;
let countdownStartedAt: number | null = null;

export default function injectSocketIO(server: any) {
	const io = new Server(server);

	function broadcastGameState(
		lastRoll: number | null,
		lastRollPlayerId: string | null,
		specialSquare: { from: number; to: number; type: 'snake' | 'ladder' } | null
	) {
		io.emit('gameStateUpdate', {
			players: gameInstance.getPlayers(),
			currentTurnId: gameInstance.getCurrentTurn()?.id ?? null,
			lastRoll,
			lastRollPlayerId,
			specialSquare
		});
	}

	io.on('connection', (socket) => {
		socket.on('joinLobby', () => {
			if (gameInstance.active) return;
			if (gameInstance.getPlayerCount() >= 4) return;

			console.log('Client joined lobby:', socket.id);

			const count = gameInstance.getPlayerCount();
			gameInstance.addPlayer(socket.id, `Player ${count + 1}`, colors[count]);

			io.emit('playerList', { players: gameInstance.getPlayers() });

			if (gameInstance.getPlayerCount() >= 2 && !countdownStarted) {
				countdownStarted = true;
				countdownStartedAt = Date.now();
				io.emit('gameStartCountdown', { remaining: 10 });
				setTimeout(() => {
					io.emit('gameStart');
					gameInstance.active = true;
					countdownStartedAt = null;
				}, 10000);
			} else if (countdownStarted && countdownStartedAt !== null) {
				const elapsed = Math.floor((Date.now() - countdownStartedAt) / 1000);
				socket.emit('gameStartCountdown', { remaining: Math.max(1, 10 - elapsed) });
			}
		});

		socket.on('gameAvailable', () => {
			socket.emit('gameAvailable', {
				available: !gameInstance.active && gameInstance.getPlayerCount() < 4
			});
		});

		socket.on('gameAllowed', () => {
			const player = gameInstance.getPlayer(socket.id);
			socket.emit('gameAllowed', { allowed: !!player });
		});

		socket.on('requestGameData', () => {
			const player = gameInstance.getPlayer(socket.id);
			if (player) {
				socket.emit('gameData', {
					players: gameInstance.getPlayers(),
					currentTurnId: gameInstance.getCurrentTurn()?.id ?? null,
					myId: socket.id
				});
			}
		});

		socket.on('playerList', () => {
			socket.emit('playerList', { players: gameInstance.getPlayers() });
		});

		socket.on('rollDice', () => {
			if (!gameInstance.active) return;
			const currentPlayer = gameInstance.getCurrentTurn();
			if (!currentPlayer || currentPlayer.id !== socket.id) return;

			const dice = Math.floor(Math.random() * 6) + 1;
			let newPos = Math.min(currentPlayer.position + dice, 25);

			let specialSquare: { from: number; to: number; type: 'snake' | 'ladder' } | null = null;
			const teleport = gameInstance.board.getSpecialSquare(newPos);
			if (teleport !== undefined) {
				specialSquare = {
					from: newPos,
					to: teleport,
					type: teleport > newPos ? 'ladder' : 'snake'
				};
				newPos = teleport;
			}

			gameInstance.updatePlayerPosition(socket.id, newPos);

			if (newPos >= 25) {
				// Broadcast the final position first so the sprite moves to square 25 on every client
				broadcastGameState(dice, socket.id, specialSquare);
				io.emit('gameOver', { winnerId: socket.id, winnerName: currentPlayer.name });
				gameInstance = new Game();
				countdownStarted = false;
				countdownStartedAt = null;
				return;
			}

			gameInstance.nextTurn();
			broadcastGameState(dice, socket.id, specialSquare);
		});

		socket.on('disconnect', () => {
			const wasCurrentTurn = gameInstance.getCurrentTurn()?.id === socket.id;
			const wasActive = gameInstance.active;

			gameInstance.removePlayer(socket.id);
			console.log('Client disconnected');

			if (gameInstance.getPlayerCount() === 0) {
				gameInstance = new Game();
				countdownStarted = false;
				countdownStartedAt = null;
				return;
			}

			io.emit('playerList', { players: gameInstance.getPlayers() });

			if (wasActive && wasCurrentTurn) {
				broadcastGameState(null, null, null);
			}
		});
	});

	console.log('SocketIO injected');
}
