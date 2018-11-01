export enum TokenType {
    Start = 'TOKEN_TYPE_START',
    MethodDefinition = 'TOKEN_TYPE_METHOD_DEFINITION',
    MethodCall = 'TOKEN_TYPE_METHOD_CALL',
    Command = 'TOKEN_TYPE_COMMAND',
    Condition = 'TOKEN_TYPE_CONDITION',
    ConditionElse = 'TOKEN_TYPE_CONDITION_ELSE',
    End = 'TOKEN_TYPE_END',
    WhileLoop = 'TOKEN_TYPE_WHILE_LOOP',
}

export enum ParameterType {
    Number = 'PARAMETER_TYPE_NUMBER',
    Text = 'PARAMETER_TYPE_TEXT',
    Boolean = 'PARAMETER_TYPE_BOOLEAN',
    Command = 'PARAMETER_TYPE_COMMAND',
}

export enum Command {
    Forward = 'COMMAND_FORWARD',
    Left = 'COMMAND_LEFT',
    Right = 'COMMAND_RIGHT',
}

export interface Parameter {
    type: ParameterType;
    value: any;
}

export interface Token {
    type: TokenType;
    parameters: Parameter[];
}

export enum ProgramSlot {
    Main = 0,
    Slot0 = 1,
    Slot1 = 2,
    Slot2 = 3,
    Slot3 = 4,
    Slot4 = 5,
    Slot5 = 6,
}

export interface ProgramList {
    [slot: number]: Token[];
}

export interface Trace {
    previousSlot: ProgramSlot;
    previousProgramIndex: number;
}

export interface Context {
    startPosition: number;
    token: Token;
    condition: boolean;
}

export class InterpreterError extends Error {
    public programIndex: number;
    public tokenIndex: number;

    constructor(error: string, programIndex: number, tokenIndex: number) {
        super(error);

        this.programIndex = programIndex;
        this.tokenIndex = tokenIndex;
    }
}
