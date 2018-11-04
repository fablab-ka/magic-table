import { GameState } from "./reducers";

export const getTurtlePosition = (state: GameState) => state.turtle.position;
export const getTurtleMarkerPosition = (state: GameState) =>
  state.markers.turtleMarkerInfo
    ? state.markers.turtleMarkerInfo.position
    : undefined;
export const getTurtleMarkerRotation = (state: GameState) =>
  state.markers.turtleMarkerInfo
    ? state.markers.turtleMarkerInfo.rotation
    : undefined;
