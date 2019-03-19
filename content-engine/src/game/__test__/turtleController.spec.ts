import WS from "jest-websocket-mock";
import { Store } from "redux";

import TurtleController from "../turtle-controller";

describe("The TurtleController", () => {
  const mockStore: Store = {
    dispatch: jest.fn(),
    getState: jest.fn(),
    replaceReducer: jest.fn(),
    subscribe: jest.fn()
  };
  const testHostname = "ws://localhost:1234";
  let turtleController: TurtleController;
  let onStateChangeHandler;
  let websocketServer: WS;

  beforeEach(() => {
    (mockStore.subscribe as jest.Mock).mockImplementation(
      (handler: () => void) => {
        onStateChangeHandler = handler;
      }
    );
    turtleController = new TurtleController(mockStore, testHostname);

    websocketServer = new WS(testHostname);
  });

  afterEach(() => {
    WS.clean();
  });

  it("can connect", async () => {
    turtleController.connect();
    await websocketServer.connected;

    await Promise.race([
      websocketServer.nextMessage,
      new Promise(resolve => setTimeout(() => resolve(Symbol("timeout")), 1000))
    ]);

    expect(websocketServer.messages).toHaveLength(1);
    expect(websocketServer.messages[0].startsWith("Connect ")).toBeTruthy();
  });
});
