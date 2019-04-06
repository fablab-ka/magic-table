import { getType } from "typesafe-actions";

import { Command } from "../../interpreter/types";
import { executeCodeCommand, updateMarkers } from "../actions";
import { GameAction } from "../reducers";
import { MarkerMap } from "../../marker-map";

export interface TurtleTargetState {
  targetPosition: {
    x: number;
    y: number;
  };
  targetRotation: number;
}

const initialTurtleTargetState = {
  targetPosition: { x: 0, y: 0 },
  targetRotation: 0
};

export default (
  state: TurtleTargetState = initialTurtleTargetState,
  action: GameAction
): TurtleTargetState => {
  switch (action.type) {
    case getType(updateMarkers):
      const targetMarker = action.payload.find(marker => marker.id === MarkerMap.TurtleMarker);
      if (targetMarker) {
        return {
          targetPosition: {
            x: targetMarker.position[0],
            y: targetMarker.position[1]
          },
          targetRotation: targetMarker.rotation
        };
      } else {
        return state;
      }

    case getType(executeCodeCommand):
      let targetRotation = state.targetRotation;
      let targetPosition = state.targetPosition;

      switch (action.payload) {
        case Command.Forward:
          targetPosition = {
            x: Math.round(targetPosition.x + Math.sin(targetRotation)),
            y: Math.round(targetPosition.y + Math.cos(targetRotation))
          };
          break;
        case Command.Left:
          targetRotation -= Math.PI / 2;
          break;
        case Command.Right:
          targetRotation += Math.PI / 2;
          break;
      }

      targetRotation = (targetRotation + Math.PI) % (Math.PI * 2);
      if (targetRotation < 0) {
        targetRotation += Math.PI;
      }
      targetRotation -= Math.PI;
      return {
        targetPosition,
        targetRotation
      };

    default:
      return state;
  }
};
