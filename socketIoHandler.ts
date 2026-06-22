import { Server } from 'socket.io';
import { Game } from './src/lib/game/Game';

let game: Game = new Game();
let colors: string[] = ['red', 'blue', 'green', 'yellow'];
let countdownGestart: boolean = false;
let countdownStartTijd: number | null = null;

export default function injectSocketIO(server: any) {
	const io = new Server(server);

	function broadcastGameState(
		laatsteRol: number | null,
		laatsteRolPlayerId: string | null,
		speciaalVakje: { from: number; to: number; type: 'snake' | 'ladder' } | null
	) {
		io.emit('gameStateUpdate', {
			players: game.getPlayers(),
			currentTurnId: game.huidigeBeurt()?.id ?? null,
			laatsteRol,
			laatsteRolPlayerId,
			speciaalVakje
		});
	}

	io.on('connection', (socket) => {
		socket.on('joinLobby', () => {
			if (game.actief) return;
			if (game.getPlayerCount() >= 4) return;

			console.log('Speler joined:', socket.id);

			const count = game.getPlayerCount();
			game.addPlayer(socket.id, `Player ${count + 1}`, colors[count]);

			io.emit('playerList', { players: game.getPlayers() });

			if (game.getPlayerCount() >= 2 && !countdownGestart) {
				countdownGestart = true;
				countdownStartTijd = Date.now();

				io.emit('gameStartCountdown', { resterend: 10 });

				setTimeout(() => {
					io.emit('gameStart');
					game.actief = true;
					countdownStartTijd = null;
				}, 10000);

			} else if (countdownGestart && countdownStartTijd !== null) {
				const verlopen = Math.floor((Date.now() - countdownStartTijd) / 1000);
				socket.emit('gameStartCountdown', { resterend: Math.max(1, 10 - verlopen) });
			}
		});

		socket.on('gameAvailable', () => {
			socket.emit('gameAvailable', {
				available: !game.actief && game.getPlayerCount() < 4
			});
		});

		socket.on('gameAllowed', () => {
			const player = game.getPlayer(socket.id);
			socket.emit('gameAllowed', { allowed: !!player });
		});

		socket.on('requestGameData', () => {
			const player = game.getPlayer(socket.id);
			if (player) {
				socket.emit('gameData', {
					players: game.getPlayers(),
					currentTurnId: game.huidigeBeurt()?.id ?? null,
					myId: socket.id
				});
			}
		});

		socket.on('playerList', () => {
			socket.emit('playerList', { players: game.getPlayers() });
		});

		socket.on('rollDobbelsteen', () => {
			if (!game.actief) return;
			const currentPlayer = game.huidigeBeurt();
			if (!currentPlayer || currentPlayer.id !== socket.id) return;

			const dice = Math.floor(Math.random() * 6) + 1;
			let newPos = Math.min(currentPlayer.position + dice, 25);

			let speciaalVakje: { from: number; to: number; type: 'snake' | 'ladder' } | null = null;
			const teleport = game.board.isSlangLadder(newPos);
			if (teleport !== undefined) {
				speciaalVakje = {
					from: newPos,
					to: teleport,
					type: teleport > newPos ? 'ladder' : 'snake'
				};
				newPos = teleport;
			}

			game.updatePlayerPosition(socket.id, newPos);

			if (newPos >= 25) {
				// Stuur winnaar naar iedereen om naam te tonen en hem naar eindvakje te verplaatsen
				broadcastGameState(dice, socket.id, speciaalVakje);
				io.emit('gameOver', { winnerId: socket.id, winnerName: currentPlayer.name });
				game = new Game();
				countdownGestart = false;
				countdownStartTijd = null;
				return;
			}

			game.volgendeBeurt();
			broadcastGameState(dice, socket.id, speciaalVakje);
		});

		socket.on('disconnect', () => {
			const wasHuidigeBeurt = game.huidigeBeurt()?.id === socket.id;
			const wasActief = game.actief;

			game.removePlayer(socket.id);
			console.log('Speler disconnect');

			if (game.getPlayerCount() === 0) {
				game = new Game();
				countdownGestart = false;
				countdownStartTijd = null;
				return;
			}

			io.emit('playerList', { players: game.getPlayers() });

			if (wasActief && wasHuidigeBeurt) {
				broadcastGameState(null, null, null);
			}
		});
	});

	console.log('SocketIO injected');
}
