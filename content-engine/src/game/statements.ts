import { Command, StatementList } from '../types';

const commandFiles: { [cmd in Command]: string } = {
    [Command.Forward]: 'tiles/scratch_tile_statement_forward.svg',
    [Command.Left]: 'tiles/scratch_tile_statement_left.svg',
    [Command.Right]: 'tiles/scratch_tile_statement_right.svg',
};

const statementIdMap: { [cmd in Command]: number[] } = {
    [Command.Forward]: [51],
    [Command.Left]: [52],
    [Command.Right]: [53],
};

const createStatementFromCommand = (command: Command) => {
    return {
        command,
        file: commandFiles[command],
        sprite: new PIXI.Sprite(),
    };
};

const statements: StatementList = {};

for (const key in Command) {
    if (Command.hasOwnProperty(key)) {
        const command = key as Command;

        const ids = statementIdMap[command];
        for (const id in ids) {
            if (ids.hasOwnProperty(id)) {
                statements[id] = createStatementFromCommand(command);
            }
        }
    }
}

export default statements;
