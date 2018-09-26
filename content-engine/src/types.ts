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
