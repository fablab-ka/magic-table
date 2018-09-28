import { Command, StatementList } from '../types';

const statements: StatementList = {
    51: {
        command: Command.Forward,
        file: 'tiles/scratch_tile_statement_forward.svg',
        sprite: new PIXI.Sprite(),
    },
    52: {
        command: Command.Left,
        file: 'tiles/scratch_tile_statement_left.svg',
        sprite: new PIXI.Sprite(),
    },
    53: {
        command: Command.Right,
        file: 'tiles/scratch_tile_statement_right.svg',
        sprite: new PIXI.Sprite(),
    },
};

export default statements;
