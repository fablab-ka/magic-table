import { Store } from "redux";
import {
  getTurtleMarkerDirection,
  getTurtleMarkerPosition,
  getTurtleMarkerRotation,
  getTurtleTargetPosition,
  getTurtleTargetRotation
} from "./state/selectors";

import { Vector } from "./game-types";

const MOVEMENT_VELOCITY = 2;
const ROTATION_VELOCITY = 0;
const MIN_DISTANCE_TO_TARGET = 20;
const MIN_ROTATION_DELTA = 10;
const CONNECTION_TIMEOUT_INTERVAL = 5000;

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
  private turtleURL: string;
  private turtleProtocols = ["arduino"];

  constructor(store: Store, turtleHostname: string) {
    this.store = store;
    this.turtleURL = `ws://${turtleHostname}:81/`;

    store.subscribe(this.onStateChange.bind(this));
  }

  public connect() {
    console.log("[TurtleController] trying to connect");

    this.connection = new WebSocket(this.turtleURL, this.turtleProtocols);
    this.connection.onopen = this.onConnectionOpen.bind(this);
    this.connection.onerror = this.onConnectionError.bind(this);
    this.connection.onmessage = this.onConnectionMessage.bind(this);
    this.connection.onclose = this.onConnectionClose.bind(this);
  }

  private onConnectionOpen() {
    if (this.connection) {
      this.connection.send("Connect " + new Date());
    }
  }

  private onConnectionError(error: Event) {
    console.log("WebSocket Error ", error);
  }

  private onConnectionMessage(e: MessageEvent) {
    console.log("Server: ", e.data);
  }

  private onConnectionClose() {
    console.log("WebSocket connection closed");

    setTimeout(() => {
      this.connect();
    }, CONNECTION_TIMEOUT_INTERVAL);
  }

  private onStateChange() {
    const connectionIsOpen =
      this.connection && this.connection.readyState !== this.connection.OPEN;
    if (!this.connection || connectionIsOpen) {
      return;
    }

    const state = this.store.getState();
    const targetPosition = getTurtleTargetPosition(state);
    const targetRotation = getTurtleTargetRotation(state);
    const currentRotation = getTurtleMarkerRotation(state);
    const currentPosition = getTurtleMarkerPosition(state);
    const currentDirection = getTurtleMarkerDirection(state);

    if (
      typeof currentPosition !== "undefined" &&
      typeof currentRotation !== "undefined" &&
      typeof currentDirection !== "undefined" &&
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
          this.sendMovement(
            TurtleDirection.Forward,
            distance,
            MOVEMENT_VELOCITY
          );
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
    let result = Math.atan2(v2[1], v2[0]) - Math.atan2(v1[1], v1[0]);
    if (result > Math.PI) {
      result -= 2 * Math.PI;
    } else if (result <= -Math.PI) {
      result += 2 * Math.PI;
    }

    return (result / Math.PI) * 180;
  }

  private rotateToAngle(angle: number) {
    if (angle > 0) {
      this.sendMovement(
        TurtleDirection.RotateLeft,
        ((Math.abs(angle) * 0.5) / 360) * 255,
        ROTATION_VELOCITY
      );
    } else {
      this.sendMovement(
        TurtleDirection.RotateRight,
        ((Math.abs(angle) * 0.6) / 360) * 255,
        ROTATION_VELOCITY
      );
    }
  }

  private sendMovement(
    direction: TurtleDirection,
    amount: number,
    velocity: number
  ) {
    if (this.connection) {
      const amountText = Math.round(amount).toString(16);
      const commandstr = `#${direction}${velocity}#${amountText}`;
      console.log(`Sending movement command: ${commandstr}`);
      this.connection.send(commandstr);
    }
  }
}
