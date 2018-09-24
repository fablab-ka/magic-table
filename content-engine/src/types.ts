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

export enum TileType {
    Dirt = 0,
    Grass = 1,
}

export enum Direction {
    nw = 'nw',
    n = 'n',
    ne = 'ne',
    w = 'w',
    e = 'e',
    sw = 'sw',
    s = 's',
    se = 'se',
    c = 'c',
    f = 'f',
    nwi = 'nwi',
    nei = 'nei',
    swi = 'swi',
    sei = 'sei',
}

export type SimpleVector = [number, number];

export interface MapData {
    meta: {
        size: { w: number, h: number },
    };
    fields: TileType[][];
}

export interface DirectionHashList {
    [direction: string]: number[];
}
