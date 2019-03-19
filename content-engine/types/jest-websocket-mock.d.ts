declare module "jest-websocket-mock" {
  export default class WS {
    constructor(url: string);

    public connected: boolean;
    public messages: string[];
    public nextMessage: string;

    public static clean(): void;
    public send(message: string): void;
    public close(): void;
    public error(): void;
  }
}
