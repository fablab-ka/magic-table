export enum Command {
    Forward = 'FORWARD',
    Left = 'LEFT',
    Right = 'RIGHT',
}

export interface Statement {
    command: Command;
    file: string;
    sprite: PIXI.Sprite;
}

export interface StatementList {
    [markerId: number]: Statement;
}

export interface Point {
    x: number;
    y: number;
}

export interface StatementInstance {
    id: number;
    statement: Statement;
    position: Point;
}
