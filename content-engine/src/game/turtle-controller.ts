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
  private lastChange: number = 0;
  private updateInterval: number = 100;
  private pixelToRobotCoordinates = 0.1;

  constructor(store: Store, turtleHostname: string) {
    this.store = store;
    this.turtleURL = turtleHostname;

    store.subscribe(this.onStateChange.bind(this));
  }

  public connect() {
    console.log("[TurtleController] trying to connect");

    this.connection = new WebSocket(this.turtleURL, this.turtleProtocols);
    this.connection.onopen = this.onConnectionOpen;
    this.connection.onerror = this.onConnectionError;
    this.connection.onmessage = this.onConnectionMessage;
    this.connection.onclose = this.onConnectionClose;
  }

  private onConnectionOpen = () => {
    if (this.connection) {
      this.connection.send("Connect " + new Date());
    }
  };

  private onConnectionError = (error: Event) => {
    console.log("[TurtleController] WebSocket Error ", error);
  };

  private onConnectionMessage = (e: MessageEvent) => {
    console.log("[TurtleController] Server: ", e.data);
  };

  private onConnectionClose = () => {
    console.log("[TurtleController] WebSocket connection closed");

    setTimeout(() => {
      this.connect();
    }, CONNECTION_TIMEOUT_INTERVAL);
  };

  private onStateChange() {
    const connectionIsOpen =
      this.connection && this.connection.readyState !== this.connection.OPEN;
    if (!this.connection || connectionIsOpen) {
      return;
    }

    if ((Date.now() - this.lastChange) < this.updateInterval) {
      return;
    }
    this.lastChange = Date.now();

    const state = this.store.getState();
    const targetPosition = { x: 500, y: 500 };//getTurtleTargetPosition(state);
    const targetRotation = Math.PI;//getTurtleTargetRotation(state);
    const currentRotation = getTurtleMarkerRotation(state);
    const currentPosition = getTurtleMarkerPosition(state);
    const currentDirection = getTurtleMarkerDirection(state);

    if (
      typeof currentPosition !== "undefined" &&
      typeof currentRotation !== "undefined" &&
      typeof currentDirection !== "undefined" &&
      typeof targetPosition !== "undefined"
    ) {
      const movementVector: Vector = this.toRobotSpace([
        targetPosition.x - currentPosition[0],
        targetPosition.y - currentPosition[1]
      ]);

      const rotationDelta = this.getRelativeRotation(
        this.toDegree(currentRotation),
        this.toDegree(targetRotation)
      );

      this.sendTarget(movementVector, rotationDelta);

      /*
      this.executemovementAlgorithm(
        currentDirection,
        movementVector,
        currentRotation,
        targetRotation
      );*/
    }
  }

  private toRobotSpace(pos: [number,number]): Vector {
    return [
      pos[0] * this.pixelToRobotCoordinates,
      pos[1] * this.pixelToRobotCoordinates
    ];
  }

  private toDegree(radian: number) {
    return (radian * 180/Math.PI) + 180;
  }

  private getRelativeRotation(current: number, target: number) {
    let result = target - current;

    if (result > 180) {
      result = -(360 - result);
    }

    return result;
  }

  private executemovementAlgorithm(
    currentDirection: Vector,
    movementVector: Vector,
    currentRotation: number,
    targetRotation: number
  ) {
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
        this.sendMovement(TurtleDirection.Forward, distance, MOVEMENT_VELOCITY);
      }
    } else {
      // ToDo rotate to targetrotation
      const rotationDelta = targetRotation - currentRotation;
      if (Math.abs(rotationDelta) > MIN_ROTATION_DELTA) {
        this.rotateToAngle(rotationDelta);
      } else {
        // Turtle arrived at destination
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
      console.log(`[TurtleController] Sending movement command: ${commandstr}`);
      this.connection.send(commandstr);
    }
  }

  private sendTarget(
    relativeTargetPosition: Vector,
    relativeTargetRotation: number
  ) {
    if (this.connection) {
      const targetPosX = relativeTargetPosition[0].toString(16);
      const targetPosY = relativeTargetPosition[1].toString(16);
      const targetRot = relativeTargetRotation.toString(16);
      const commandstr = `>${targetPosX} ${targetPosY} ${targetRot}`;
      console.log(`[TurtleController] Sending target command: ${commandstr}`);
      this.connection.send(commandstr);
    } else {
      console.log("[TurtleController] No connection yet");
    }
  }
}
