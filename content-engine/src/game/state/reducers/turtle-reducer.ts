import { getType } from "typesafe-actions";

import { Command } from "../../interpreter/types";
import { executeCodeCommand } from "../actions";
import { GameAction } from "../reducers";

export interface TurtleState {
  position: {
    x: number;
    y: number;
  };
  direction: number;
}

const initialTurtleState = {
  direction: 0,
  position: { x: 0, y: 0 }
};

export default (
  state: TurtleState = initialTurtleState,
  action: GameAction
): TurtleState => {
  switch (action.type) {
    case getType(executeCodeCommand):
      let direction = state.direction;
      let position = state.position;

      switch (action.payload) {
        case Command.Forward:
          position = {
            x: Math.round(position.x + Math.sin(direction)),
            y: Math.round(position.y + Math.cos(direction))
          };
          break;
        case Command.Left:
          direction -= Math.PI / 2;
          break;
        case Command.Right:
          direction += Math.PI / 2;
          break;
      }

      direction = (direction + Math.PI) % (Math.PI * 2);
      if (direction < 0) {
        direction += Math.PI;
      }
      direction -= Math.PI;
      return {
        direction,
        position
      };

    default:
      return state;
  }
};
