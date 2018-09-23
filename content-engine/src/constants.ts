import { Direction, DirectionHashList, SimpleVector } from './types';

export const AdjourningTilePostfixMap = {
    0: { 0: 'c', 1: 'e' },
    1: { 0: 's', 1: 'se' },
};

export const DirectionInversionMap: { [direction in Direction]: Direction} = {
    // tslint:disable-next-line:object-literal-sort-keys
    [Direction.nw]: Direction.se, [Direction.n]: Direction.s, [Direction.ne]: Direction.sw,
    [Direction.w]: Direction.e, [Direction.c]: Direction.c, [Direction.e]: Direction.w,
    [Direction.sw]: Direction.ne, [Direction.s]: Direction.n, [Direction.se]: Direction.nw,
    // tslint:disable-next-line:max-line-length
    [Direction.nwi]: Direction.sei, [Direction.nei]: Direction.swi, [Direction.swi]: Direction.nei, [Direction.sei]: Direction.nwi,
    [Direction.f]: Direction.f,
    [Direction.c]: Direction.c,
};

export const DirectionFlag = [
    [1, 2, 4],
    [128, 0, 8],
    [64, 32, 16],
];

export const backgroundColor = 0x333333;

export const tileSize = 64;

/*
      1  2    4
    128  X    8
     64  32  16
 */
export const DirectionHashes: DirectionHashList = {
    nw: [1],
    // tslint:disable-next-line:object-literal-sort-keys
    n: [2, 5, 3, 6, 7],
    ne: [4],
    w: [128, 129, 65, 172, 173, 192, 193],
    e: [8, 12, 24, 28, 20],
    sw: [64],
    s: [32, 96, 48, 80, 112],
    se: [16],
    c: [68, 17, 136, 34, 35, 0],
    f: [248, 255, 167, 95, 220, 221, 253, 37, 38, 39, 40, 41, 42, 43, 45, 46,
        47, 49, 50, 51, 53, 54, 55, 57, 58, 59, 61, 62, 63,
        73, 74, 75, 77, 78, 79, 82, 83, 85, 86, 87, 89, 90, 91, 93, 94, 95],
    nwi: [130, 131, 135, 134, 67, 66, 120, 199, 69, 70, 71],
    nei: [10, 14, 15, 19, 9, 11, 13, 18, 21, 22, 23, 25, 26, 27, 29, 30, 31],
    swi: [160, 224, 33, 240, 81],
    sei: [56, 40, 124, 92, 60, 108, 36, 40, 44, 56, 60, 72, 76, 84, 88, 92],
};

export const DirectionOffsetMap: { [direction in Direction]: SimpleVector[]} = {
    nw: [[-1, -1], [-1, -1], [-1, -1]],
    // tslint:disable-next-line:object-literal-sort-keys
    n: [[-1, -1], [0, -1], [1, -1]],
    ne: [[1, -1], [1, -1], [1, -1]],
    w: [[-1, 1], [-1, 0], [-1, -1]],
    e: [[1, 1], [1, 0], [1, -1]],
    sw: [[-1, 1], [-1, 1], [-1, 1]],
    s: [[1, 1], [0, 1], [-1, 1]],
    se: [[1, 1], [1, 1], [1, 1]],
    nwi: [[-1, -1], [-1, 0], [-1, -1], [0, -1], [1, -1]],
    nei: [[-1, -1], [0, -1], [1, -1], [1, 0], [1, -1]],
    swi: [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1]],
    sei: [[-1, 1], [0, 1], [1, 1], [1, 0], [1, -1]],
    c: [[0, 0], [0, 0], [0, 0]],
    f: [[0, 0], [0, 0], [0, 0]],
};
