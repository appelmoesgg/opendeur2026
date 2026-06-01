// from → to: positive = ladder (go up), negative = snake (go down)
const SPECIAL_SQUARES: Record<number, number> = {
    6: 15,
    11: 20,
    22: 14,
    8: 1,
};

export class Board {
    private width: number;
    private height: number;

    constructor(width: number = 5, height: number = 5) {
        this.width = width;
        this.height = height;
    }

    getXY(position: number, doOffsetBy: number): { x: number; y: number } {
        const index = position - 1;
        const row = Math.floor(index / this.width);
        let col = index % this.width;
        if (row % 2 === 1) {
            col = this.width - 1 - col;
        }
        return {
            x: col * 120 + 60 + doOffsetBy * 15 - 30,
            y: (this.height - 1 - row) * 120 + 80
        };
    }

    isValidPosition(position: number): boolean {
        return position >= 1 && position <= (this.width * this.height);
    }

    getSpecialSquare(position: number): number | undefined {
        return SPECIAL_SQUARES[position];
    }
}