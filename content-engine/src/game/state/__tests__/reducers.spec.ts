import { Command } from "../../interpreter/types";
import { executeCodeCommand } from "../actions";
import { turtlePositionReducer, TurtleState } from "../reducers";

describe("The Reducers", () => {
  describe("turtlePositionReducer", () => {
    const initialState: TurtleState = {
      direction: 0,
      position: {
        x: 0,
        y: 0
      }
    };

    const executeCommands = (commands: Command[]) => {
      let result = initialState;

      commands.forEach(cmd => {
        result = turtlePositionReducer(result, executeCodeCommand(cmd));
      });

      return result;
    };

    it("rotates +90° on action right", () => {
      const newState = turtlePositionReducer(
        initialState,
        executeCodeCommand(Command.Right)
      );
      expect(newState.direction * (180 / Math.PI)).toBeCloseTo(90);
    });

    it("rotates -90° on action left", () => {
      const newState = turtlePositionReducer(
        initialState,
        executeCodeCommand(Command.Left)
      );
      expect(newState.direction * (180 / Math.PI)).toBeCloseTo(-90);
    });

    it("rotates -180° on action left twice", () => {
      const newState = executeCommands([Command.Left, Command.Left]);
      expect(newState.direction * (180 / Math.PI)).toBeCloseTo(-180);
    });

    it.skip("rotates 180° on action right twice", () => {
      const newState = executeCommands([Command.Right, Command.Right]);
      expect(newState.direction * (180 / Math.PI)).toBeCloseTo(180);
    });

    it("moves 1 in Y on action forward and not turned", () => {
      const newState = turtlePositionReducer(
        initialState,
        executeCodeCommand(Command.Forward)
      );
      expect(newState.position.y).toBe(1);
      expect(newState.position.x).toBe(0);
    });

    it("moves 1 in X on action forward and turned right", () => {
      const newState = executeCommands([Command.Right, Command.Forward]);
      expect((newState.direction * 180) / Math.PI).toBe(90);
      expect(newState.position.x).toBe(1);
      expect(newState.position.y).toBe(0);
    });

    it("moves -1 in X on action forward and turned left", () => {
      const newState = executeCommands([Command.Left, Command.Forward]);
      expect((newState.direction * 180) / Math.PI).toBe(-90);
      expect(newState.position.x).toBe(-1);
      expect(newState.position.y).toBe(0);
    });

    it("moves -1 in Y on action forward and turned left twice", () => {
      const newState = executeCommands([
        Command.Left,
        Command.Left,
        Command.Forward
      ]);

      expect(newState.direction).toBe(-Math.PI);
      expect(Math.sin(newState.direction)).toBeCloseTo(0);
      expect(Math.cos(newState.direction)).toBeCloseTo(-1);
      expect((newState.direction * 180) / Math.PI).toBe(-180);
      expect(newState.position.y).toBe(-1);
      expect(newState.position.x).toBe(-0);
    });
  });
});
