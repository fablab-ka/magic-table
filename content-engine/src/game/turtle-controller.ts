import { Store } from "redux";
import {
  getTurtleMarkerPosition,
  getTurtleMarkerRotation,
  getTurtlePosition
} from "./state/selectors";

import { Vector } from "./game-types";

const MOVEMENT_VELOCITY = 255;
const MIN_DISTANCE_TO_TARGET = 20;
const MIN_ROTATION_DELTA = 5;

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
    const targetPosition = { x: 700, y: 500 }; //getTurtlePosition(state);
    const targetRotation = 45; //getTurtleRotation(state);
    const currentRotation = getTurtleMarkerRotation(state);
    const currentPosition = getTurtleMarkerPosition(state);
    const currentDirection = getTurtleMarkerDirection(state);

    if (
      typeof currentPosition !== "undefined" &&
      typeof currentRotation !== "undefined" &&
      typeof targetPosition !== "undefined"
    ) {
      const movementVector: Vector = [
        targetPosition.x - currentPosition[0],
        targetPosition.y - currentPosition[1]
      ];

      const distance = this.getDistance(movementVector);

      if (distance > MIN_DISTANCE_TO_TARGET) {
        const rotationDelta = this.getAngleBetween(
          movementVector,
          currentDirection
        );
        if (Math.abs(rotationDelta) > MIN_ROTATION_DELTA) {
          // look at target
          this.rotateToAngle(rotationDelta);
        } else {
          // move to target
          this.sendMovement(TurtleDirection.Forward, distance);
        }
      } else {
        // TODo rotate to taretrotation
        const rotationDelta = targetRotation - currentRotation;
        if (Math.abs(rotationDelta) > MIN_ROTATION_DELTA) {
          this.rotateToAngle(rotationDelta);
        } else {
          // Turtle arrived at destination
        }
      }
    }
  }

  private getDistance(v: Vector) {
    return Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2));
  }

  private getAngleBetween(v1: Vector, v2: Vector) {
    return 0; // TODO
  }

  private rotateToAngle(angle: number) {
    if (angle > 0) {
      this.sendMovement(TurtleDirection.RotateLeft, angle);
    } else {
      this.sendMovement(TurtleDirection.RotateRight, angle);
    }
  }

  private sendMovement(direction: TurtleDirection, amount: number) {
    if (this.connection) {
      const velocity = MOVEMENT_VELOCITY.toString(8);
      const amountText = amount.toString(8);
      const commandstr = `#${direction}${velocity}#${amountText}`;
      console.log(`Sending movement command: ${commandstr}`);
      this.connection.send(commandstr);
    }
  }
}
