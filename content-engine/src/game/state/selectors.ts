import { GameState } from "./reducers";

export const getTurtleTargetPosition = (state: GameState) =>
  state.turtle.targetPosition;
export const getTurtleTargetRotation = (state: GameState) =>
  state.turtle.targetRotation;
export const getTurtleMarkerPosition = (state: GameState) =>
  state.markers.turtleMarkerInfo
    ? state.markers.turtleMarkerInfo.position
    : undefined;
export const getTurtleMarkerRotation = (state: GameState) =>
  state.markers.turtleMarkerInfo
    ? state.markers.turtleMarkerInfo.rotation
    : undefined;
export const getTurtleMarkerDirection = (state: GameState) =>
  state.markers.turtleMarkerInfo
    ? state.markers.turtleMarkerInfo.direction
    : undefined;

export const getStatements = (state: GameState) => state.activeStatements;
