import { Store } from "redux";
import { getTurtleMarkerPosition, getTurtlePosition } from "./state/selectors";

const MOVEMENT_DURATION = 200;

enum TurtleDirection {
  Stop = "0",
  TurnLeftWheel = "1",
  TurnRightWheel = "2",
  Forward = "3"
}

export default class TurtleController {
  private store: Store;
  private connection?: WebSocket;
  private turtleHostname: string;

  constructor(store: Store, turtleHostname: string) {
    this.store = store;
    this.turtleHostname = turtleHostname;

    store.subscribe(this.onStateChange.bind(this));
  }

  public connect() {
    this.connection = new WebSocket(`ws://${this.turtleHostname}:81/`, [
      "arduino"
    ]);
    this.connection.onopen = () => {
      if (this.connection) {
        this.connection.send("Connect " + new Date());
      }
    };
    this.connection.onerror = error => {
      console.log("WebSocket Error ", error);
    };
    this.connection.onmessage = e => {
      console.log("Server: ", e.data);
    };
    this.connection.onclose = () => {
      console.log("WebSocket connection closed");
    };
  }

  private onStateChange() {
    if (!this.connection) {
      return;
    }

    const state = this.store.getState();
    const targetPosition = getTurtlePosition(state);
    const currentPosition = getTurtleMarkerPosition(state);
    // const currentRotation = getTurtleMarkerRotation(state);

    if (currentPosition) {
      const movementVector = [
        targetPosition.x - currentPosition[0],
        targetPosition.y - currentPosition[1]
      ];

      // TODO transmit movement command to turtle
    }
  }

  private sendMovement(direction: TurtleDirection) {
    if (this.connection) {
      const commandstr = `#${direction}${MOVEMENT_DURATION.toString(16)}`;
      console.log(`Sending movement command: ${commandstr}`);
      this.connection.send(commandstr);
    }
  }
}
