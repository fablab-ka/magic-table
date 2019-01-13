import { Store } from "redux";
import {
  getTurtleMarkerPosition,
  getTurtleMarkerRotation,
  getTurtlePosition
} from "./state/selectors";

const MOVEMENT_DURATION = 255;
const MOVEMENT_VELOCITY = 255;

enum TurtleDirection {
  Stop = "0",
  RotateLeft = "1",
  RotateRight = "2",
  Forward = "3",
  Backward = "4"
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
    const currentRotation = getTurtleMarkerRotation(state);
    const currentPosition = getTurtleMarkerPosition(state);

    if (currentPosition && currentRotation) {
      const movementVector = [
        targetPosition.x - currentPosition[0],
        targetPosition.y - currentPosition[1]
      ];

      const targetRotation = 0; // TODO get angle of movementVector

      // if (movementVector[0] <= 0) {
      // } else {
      // }
      const rotationDelta = targetRotation - currentRotation;
      // TODO transmit movement command to turtle
    }
  }

  private sendMovement(direction: TurtleDirection) {
    if (this.connection) {
      const velocity = MOVEMENT_VELOCITY.toString(16);
      const duration = MOVEMENT_DURATION.toString(16);
      const commandstr = `#${direction}${velocity}${duration}`;
      console.log(`Sending movement command: ${commandstr}`);
      this.connection.send(commandstr);
    }
  }
}
