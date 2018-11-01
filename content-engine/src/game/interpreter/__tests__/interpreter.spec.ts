import Interpreter from '../interpreter';
import { Token, TokenType, ParameterType, Command } from '../types';

describe('The Interpreter', () => {
  it('doesn\'t accept missing Main tokens', () => {
    const interpreter = new Interpreter();

    const tokenLists: Token[][] = [[{ type: TokenType.End, parameters: [] }]];

    expect(() => interpreter.updateTokens(tokenLists)).toThrow(
      'Invalid Program start'
    );
  });

  it('Ends after stepping into the end', () => {
    const interpreter = new Interpreter();

    const tokenLists: Token[][] = [];

    interpreter.updateTokens(tokenLists);

    interpreter.step();

    expect(interpreter.getHasEnded()).toBeTruthy();

    interpreter.step();

    expect(interpreter.getHasEnded()).toBeTruthy();
  });

  it('Doesn\' end while it has commands', () => {
    const interpreter = new Interpreter();

    const tokenLists: Token[][] = [
      [
        { type: TokenType.Start, parameters: [] },
        { type: TokenType.Command, parameters: [{ type: ParameterType.Command, value: Command.Right }] },
      ],
    ];

    interpreter.updateTokens(tokenLists);

    interpreter.step();

    expect(interpreter.getHasEnded()).toBeFalsy();
  });

  it('Handles commands', () => {
    const interpreter = new Interpreter();

    const tokenLists: Token[][] = [
      [
        { type: TokenType.Start, parameters: [] },
        { type: TokenType.Command, parameters: [{ type: ParameterType.Command, value: Command.Forward }] },
        { type: TokenType.Command, parameters: [{ type: ParameterType.Command, value: Command.Left }] },
        { type: TokenType.Command, parameters: [{ type: ParameterType.Command, value: Command.Right }] },
      ],
    ];

    interpreter.updateTokens(tokenLists);

    interpreter.step();
    interpreter.step();
    interpreter.step();
    interpreter.step();

    expect(interpreter.getHasEnded()).toBeTruthy();
  });
});
