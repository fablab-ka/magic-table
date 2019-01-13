import Interpreter from "../interpreter";
import { Command, ParameterType, Token, TokenType } from "../types";

describe("The Interpreter", () => {
  it("doesn't accept missing Main tokens", () => {
    const dispatch = jest.fn();
    const interpreter = new Interpreter(dispatch);

    const tokenLists: Token[][] = [[{ type: TokenType.End, parameters: [] }]];

    expect(() => interpreter.updateTokens(tokenLists)).toThrow(
      "Invalid Program start"
    );
  });

  it("Ends after stepping into the end", () => {
    const dispatch = jest.fn();
    const interpreter = new Interpreter(dispatch);

    const tokenLists: Token[][] = [];

    interpreter.updateTokens(tokenLists);

    interpreter.step();

    expect(interpreter.getHasEnded()).toBeTruthy();

    interpreter.step();

    expect(interpreter.getHasEnded()).toBeTruthy();
  });

  it("Doesn' end while it has commands", () => {
    const dispatch = jest.fn();
    const interpreter = new Interpreter(dispatch);

    const tokenLists: Token[][] = [
      [
        { type: TokenType.Start, parameters: [] },
        {
          parameters: [{ type: ParameterType.Command, value: Command.Right }],
          type: TokenType.Command
        }
      ]
    ];

    interpreter.updateTokens(tokenLists);

    interpreter.step();

    expect(interpreter.getHasEnded()).toBeFalsy();
  });

  it("Handles commands", () => {
    const dispatch = jest.fn();
    const interpreter = new Interpreter(dispatch);

    const tokenLists: Token[][] = [
      [
        { type: TokenType.Start, parameters: [] },
        {
          parameters: [{ type: ParameterType.Command, value: Command.Forward }],
          type: TokenType.Command
        },
        {
          parameters: [{ type: ParameterType.Command, value: Command.Left }],
          type: TokenType.Command
        },
        {
          parameters: [{ type: ParameterType.Command, value: Command.Right }],
          type: TokenType.Command
        }
      ]
    ];

    interpreter.updateTokens(tokenLists);

    interpreter.step();
    interpreter.step();
    interpreter.step();
    interpreter.step();

    expect(interpreter.getHasEnded()).toBeTruthy();
  });

  it("Handles condition", () => {
    const dispatch = jest.fn();
    const interpreter = new Interpreter(dispatch);

    const tokenLists: Token[][] = [
      [
        { type: TokenType.Start, parameters: [] },
        {
          parameters: [{ type: ParameterType.Boolean, value: true }],
          type: TokenType.WhileLoop
        },
        {
          parameters: [{ type: ParameterType.Command, value: Command.Left }],
          type: TokenType.Command
        },
        { type: TokenType.End, parameters: [] }
      ]
    ];

    interpreter.updateTokens(tokenLists);

    interpreter.step();
    interpreter.step();
    interpreter.step();
    interpreter.step();
    interpreter.step();
    interpreter.step();

    expect(dispatch).toHaveBeenCalledTimes(3);
  });
});
