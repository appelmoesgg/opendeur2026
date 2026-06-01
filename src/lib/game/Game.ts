import { Board } from './Board.ts';
import { Player } from './Player.ts';

export class Game {
    board: Board;
    players: Player[] = [];
    active: boolean = false;

    constructor() {
        this.board = new Board(5, 5);
    }

    addPlayer(id: string, name: string, color: string, pos: number = 0): Player {
        const player = new Player(id, name, color, pos);
        this.players.push(player);
        return player;
    }

    removePlayer(id: string): void {
        this.players = this.players.filter(player => player.id !== id);
    }

    getPlayer(id: string): Player | undefined {
        return this.players.find(player => player.id === id);
    }

    getPlayerCount(): number {
        return this.players.length;
    }

    getPlayers(): Player[] {
        return this.players;
    }

    updatePlayerPosition(id: string, position: number): void {
        const player = this.getPlayer(id);
        if (player && this.board.isValidPosition(position)) {
            player.moveTo(position);
        }
    }
}