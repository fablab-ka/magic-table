import { Store } from "redux";
import { getTurtleMarkerPosition, getTurtlePosition } from "./state/selectors";

export default class TurtleController {
  private store: Store;

  constructor(store: Store) {
    this.store = store;

    store.subscribe(this.onStateChange.bind(this));
  }

  private onStateChange() {
    const state = this.store.getState();
    const targetPosition = getTurtlePosition(state);
    const actualPosition = getTurtleMarkerPosition(state);

    if (actualPosition) {
      const movementVector = [
        targetPosition.x - actualPosition[0],
        targetPosition.y - actualPosition[1]
      ];

      // TODO transmit movement command to turtle
    }
  }
}
