import { Store } from "redux";

import Interpreter from "./interpreter/interpreter";
import Tokenizer from "./interpreter/tokenizer";
import { getStatements } from "./state/selectors";

const STEP_INTERVAL = 1000;

export default class GameController {
  private started: boolean = false;
  private interpreter: Interpreter;
  private tokenizer: Tokenizer;

  constructor(private store: Store) {
    this.interpreter = new Interpreter(store.dispatch.bind(this.store));
    this.tokenizer = new Tokenizer();

    this.store.subscribe(this.onStoreChange.bind(this));
  }

  public start() {
    this.started = true;

    setInterval(this.onStep.bind(this), STEP_INTERVAL);
  }

  private onStoreChange() {
    if (!this.started) {
      return;
    }

    const statements = getStatements(this.store.getState());
    const tokens = this.tokenizer.tokenizeMarkers(statements);
    this.interpreter.updateTokens(tokens);
  }

  private onStep() {
    this.interpreter.step();
  }
}
