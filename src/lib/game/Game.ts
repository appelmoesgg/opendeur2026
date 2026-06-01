import { Board } from './Board.ts';
import { Player } from './Player.ts';

export class Game {
    board: Board;
    players: Player[] = [];
    active: boolean = false;
    currentTurnIndex: number = 0;

    constructor() {
        this.board = new Board(5, 5);
    }

    addPlayer(id: string, name: string, color: string, pos: number = 1): Player {
        const player = new Player(id, name, color, pos);
        this.players.push(player);
        return player;
    }

    removePlayer(id: string): void {
        const index = this.players.findIndex(p => p.id === id);
        if (index === -1) return;
        this.players = this.players.filter(player => player.id !== id);
        if (index < this.currentTurnIndex) {
            this.currentTurnIndex--;
        } else if (this.currentTurnIndex >= this.players.length && this.players.length > 0) {
            this.currentTurnIndex = 0;
        }
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

    getCurrentTurn(): Player | undefined {
        if (this.players.length === 0) return undefined;
        return this.players[this.currentTurnIndex];
    }

    nextTurn(): void {
        if (this.players.length === 0) return;
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
    }

    updatePlayerPosition(id: string, position: number): void {
        const player = this.getPlayer(id);
        if (player && this.board.isValidPosition(position)) {
            player.moveTo(position);
        }
    }
}
