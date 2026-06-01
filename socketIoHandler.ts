import { Server } from 'socket.io';
import { Game } from './src/lib/game/Game';

let gameInstance: Game = new Game();
let colors: string[] = ['red', 'blue', 'green', 'yellow'];

export default function injectSocketIO(server: any) {
	const io = new Server(server);

	io.on('connection', (socket) => {
		socket.on('joinLobby', () => {
			console.log('Client joined lobby:', socket.id);

			gameInstance.addPlayer(
				socket.id,
				`Player${gameInstance.getPlayerCount()}`,
				colors[gameInstance.getPlayerCount()]
			);

			io.emit('playerList', {
				players: gameInstance.getPlayers()
			});

			if (gameInstance.getPlayerCount() >= 2) {
				io.emit('gameStartCountdown');
				setTimeout(() => {
					io.emit('gameStart');
					gameInstance.active = true;
				}, 30000);
			}
		});

		socket.on('gameAvailable', () => {
			io.emit('gameAvailable', {
				available: !gameInstance.active
			});
		});

		socket.on('gameAllowed', () => {
			const player = gameInstance.getPlayer(socket.id);
			io.emit('gameAllowed', {
				allowed: !!player
			});
		});

		socket.on('requestGameData', () => {
			const player = gameInstance.getPlayer(socket.id);
			if (player) {
				socket.emit('gameData', {
					board: gameInstance.board,
					players: gameInstance.getPlayers()
				});
			}
		});

		socket.on('playerList', () => {
			socket.emit('playerList', {
				players: gameInstance.getPlayers()
			});
		});

		socket.on('disconnect', () => {
			gameInstance.removePlayer(socket.id);
			io.emit('playerList', {
				players: gameInstance.getPlayers()
			});
			console.log('Client disconnected');
		});
	});

	console.log('SocketIO injected');
}
