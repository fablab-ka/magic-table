import { Signal } from "micro-signals";
import { Store } from "redux";

import { MarkerMessage } from "./game-types";
import { updateMarkers } from "./state/actions";

// const WEBSOCKET_URL = "ws://localhost:9000/";
const WEBSOCKET_URL = "ws://magictable.flka.space:9000/";

export default class GameCommunication {
  public onMarkerMessage: Signal<MarkerMessage>;

  private socket?: WebSocket = undefined;
  private store: Store;

  constructor(store: Store) {
    this.store = store;

    this.onMarkerMessage = new Signal<MarkerMessage>();
  }

  public start() {
    console.log("Connecting to WebSocket at", WEBSOCKET_URL);

    this.socket = new WebSocket(WEBSOCKET_URL);
    this.socket.addEventListener("open", e => {
      console.log("WebSocket Open", e);
    });

    this.socket.addEventListener("close", e => {
      console.log("WebSocket Close", e);
    });

    this.socket.addEventListener("error", e => {
      console.log("WebSocket Close", e);
    });

    this.socket.addEventListener("message", msg => {
      this.handleMessage(msg);
    });
  }

  private handleMessage(msg: MessageEvent) {
    // console.log('WebSocket Message', msg);

    if (msg.data instanceof Blob) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") {
          throw new Error(
            "Unable to parse message " + JSON.stringify(reader.result)
          );
        }

        this.onMessageBlob(reader.result);
      };
      reader.readAsText(msg.data);
    } else if (typeof msg.data === "string") {
      this.onMessageBlob(msg.data);
    } else {
      console.log("unexpected message data", msg);
    }
  }

  private onMessageBlob(blob: string) {
    const markerMessage = JSON.parse(blob) as MarkerMessage;

    this.onMarkerMessage.dispatch(markerMessage);
    this.store.dispatch(updateMarkers(markerMessage));
  }
}
