export class Player {
    id: string;
    name: string;
    color: string;
    position: number;

    constructor(id: string, name: string, color: string, position: number = 1) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.position = position;
    }

    moveTo(position: number): void {
        this.position = position;
    }
}