import { Context, InterpreterError, ProgramList, ProgramSlot, Token, TokenType, Trace } from './types';

export default class Interpreter {
    private programs: ProgramList;
    private position: number;
    private programSlot: ProgramSlot;
    private callstack: Trace[];
    private contextStack: Context[];
    private hasEnded: boolean;

    constructor() {
        this.programs = [];
        this.callstack = [];
        this.contextStack = [];
        this.position = -1;
        this.programSlot = ProgramSlot.Main;
        this.hasEnded = false;
    }

    public getHasEnded() { return this.hasEnded; }

    public updateTokens(tokenLists: Token[][]) {
        console.log('update tokens');

        const programList: ProgramList = {};

        tokenLists.forEach((tokens, index) => {
            if (tokens.length <= 0) {
                return;
            }

            if (tokens[0].type === TokenType.Start) {
                programList[ProgramSlot.Main] = tokens.slice(1);
            } else if (tokens[0].type === TokenType.MethodDefinition) {
                programList[tokens[0].parameters[0].value as ProgramSlot] = tokens.slice(1);
            } else {
                throw new InterpreterError('Invalid Program start', index, 0);
                this.hasEnded = true;
            }
        });

        if (this.programHasChanged(this.programs, programList)) {
            this.reset();
            this.programs = programList;
        } else {
            console.log('no change in program');
        }
    }

    public reset() {
        this.programs = [];
        this.callstack = [];
        this.contextStack = [];
        this.position = -1;
        this.programSlot = ProgramSlot.Main;
        this.hasEnded = false;
    }

    public step() {
        if (this.hasEnded) { return; }

        this.position += 1;

        console.log('new position is ' + this.position);

        const program = this.programs[this.programSlot];
        if (!program) {
            if (this.programSlot === ProgramSlot.Main) {
                this.hasEnded = true;
                return;
            }

            throw new InterpreterError('Invalid Program slot', this.programSlot, 0);
        }

        const token = program[this.position];
        if (!token) {
            // TODO pop stack for method calls
            if (this.contextStack.length > 0) {
                this.throwError('Missing context end token');
            } else {
                this.hasEnded = true; // End of Program
            }
        } else {
            let context: Context | undefined;

            if (this.contextStack.length > 0) {
                context = this.contextStack[this.contextStack.length - 1];
            }

            if (this.doesCloseContext(token)) {
                this.closeCurrentContext();
            } else if (!context || context.condition) {
                // ignore statment because context condition is false

                if (this.doesOpenContext(token)) {
                    this.openContext(token);
                } else {
                    this.eat(token, context);
                }
            }
        }
    }

    private openContext(token: Token) {
        console.log('open context ' + token.type);

        const condition = this.evaluateContextCondition(token);
        this.contextStack.push({ token, condition, startPosition: this.position });
    }

    private closeCurrentContext() {
        if (this.contextStack.length <= 0) {
            this.throwError('Unexpected ending token');
        }

        const context = this.contextStack[this.contextStack.length - 1];
        console.log('close context ' + context.token.type);

        if (this.isLoopingToken(context.token)) {
            context.condition = this.evaluateContextCondition(context.token);

            if (context.condition) {
                this.position = context.startPosition;
            } else {
                this.contextStack.pop();
            }
        } else {
            this.contextStack.pop();
        }
    }

    private evaluateContextCondition(token: Token): boolean {
        return token.parameters[0].value as boolean; // TODO
    }

    private isLoopingToken(token: Token): boolean {
        return token.type === TokenType.WhileLoop;
    }

    private doesOpenContext(token: Token): boolean {
        return token.type === TokenType.Condition
            || token.type === TokenType.ConditionElse
            || token.type === TokenType.WhileLoop;
    }

    private doesCloseContext(token: Token): boolean {
        return token.type === TokenType.End
            || token.type === TokenType.ConditionElse;
    }

    private eat(token: Token, context?: Context) {
        console.log('eat ' + token.type);

        if (token.type === TokenType.MethodCall) {
            throw new Error('not yet implemented'); // TODO
        } else if (token.type === TokenType.Command) {
            console.log('eating command ', token.parameters[0].value);
        } else {
            this.throwError('Invalid token type here: ' + token.type);
        }
    }

    private throwError(error: string) {
        this.hasEnded = true;
        throw new InterpreterError(error, this.programSlot, this.position);
    }

    private programHasChanged(programs: ProgramList, otherPrograms: ProgramList) {
        return true; // TODO
    }
}
