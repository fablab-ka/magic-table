import { Command } from "../../../interpreter/types";
import { executeCodeCommand } from "../../actions";
import turtleReducer, { TurtleTargetState } from "../turtle-reducer";

describe("The Turtle Reducer", () => {
  const initialState: TurtleTargetState = {
    targetPosition: {
      x: 0,
      y: 0
    },
    targetRotation: 0
  };

  const executeCommands = (commands: Command[]) => {
    let result = initialState;

    commands.forEach(cmd => {
      result = turtleReducer(result, executeCodeCommand(cmd));
    });

    return result;
  };

  it("rotates +90° on action right", () => {
    const newState = turtleReducer(
      initialState,
      executeCodeCommand(Command.Right)
    );
    expect(newState.targetRotation * (180 / Math.PI)).toBeCloseTo(90);
  });

  it("rotates -90° on action left", () => {
    const newState = turtleReducer(
      initialState,
      executeCodeCommand(Command.Left)
    );
    expect(newState.targetRotation * (180 / Math.PI)).toBeCloseTo(-90);
  });

  it("rotates -180° on action left twice", () => {
    const newState = executeCommands([Command.Left, Command.Left]);
    expect(newState.targetRotation * (180 / Math.PI)).toBeCloseTo(-180);
  });

  it.skip("rotates 180° on action right twice", () => {
    const newState = executeCommands([Command.Right, Command.Right]);
    expect(newState.targetRotation * (180 / Math.PI)).toBeCloseTo(180);
  });

  it("moves 1 in Y on action forward and not turned", () => {
    const newState = turtleReducer(
      initialState,
      executeCodeCommand(Command.Forward)
    );
    expect(newState.targetPosition.y).toBe(1);
    expect(newState.targetPosition.x).toBe(0);
  });

  it("moves 1 in X on action forward and turned right", () => {
    const newState = executeCommands([Command.Right, Command.Forward]);
    expect((newState.targetRotation * 180) / Math.PI).toBe(90);
    expect(newState.targetPosition.x).toBe(1);
    expect(newState.targetPosition.y).toBe(0);
  });

  it("moves -1 in X on action forward and turned left", () => {
    const newState = executeCommands([Command.Left, Command.Forward]);
    expect((newState.targetRotation * 180) / Math.PI).toBe(-90);
    expect(newState.targetPosition.x).toBe(-1);
    expect(newState.targetPosition.y).toBe(0);
  });

  it("moves -1 in Y on action forward and turned left twice", () => {
    const newState = executeCommands([
      Command.Left,
      Command.Left,
      Command.Forward
    ]);

    expect(newState.targetRotation).toBe(-Math.PI);
    expect(Math.sin(newState.targetRotation)).toBeCloseTo(0);
    expect(Math.cos(newState.targetRotation)).toBeCloseTo(-1);
    expect((newState.targetRotation * 180) / Math.PI).toBe(-180);
    expect(newState.targetPosition.y).toBe(-1);
    expect(newState.targetPosition.x).toBe(-0);
  });
});
