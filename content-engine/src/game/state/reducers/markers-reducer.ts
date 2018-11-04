import { getType } from "typesafe-actions";

import { MarkerInfo } from "../../game-types";
import { MarkerMap } from "../../marker-map";
import { updateMarkers } from "../actions";
import { GameAction } from "../reducers";

export interface MarkerState {
  turtleMarkerInfo?: MarkerInfo;
}

const initialMarkerState: MarkerState = {
  turtleMarkerInfo: undefined
};

export default (
  state: MarkerState = initialMarkerState,
  action: GameAction
): MarkerState => {
  switch (action.type) {
    case getType(updateMarkers):
      const markerMessage = action.payload.find(
        msg => msg.ids[0] === MarkerMap.TurtleMarker
      );
      let turtleMarkerInfo: MarkerInfo | undefined;
      if (markerMessage) {
        const position: [number, number] = [
          markerMessage.transform[0][2],
          markerMessage.transform[1][2]
        ];
        const rotation = 0; // TODO
        turtleMarkerInfo = {
          id: MarkerMap.TurtleMarker,
          position,
          rotation,
          transform: markerMessage.transform
        };
      }
      return {
        ...state,
        turtleMarkerInfo
      };

    default:
      return state;
  }
};
