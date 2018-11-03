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
      return {
        ...state,
        turtleMarkerInfo: action.payload.find(
          markerInfo => markerInfo.id === MarkerMap.TurtleMarker
        )
      };

    default:
      return state;
  }
};
