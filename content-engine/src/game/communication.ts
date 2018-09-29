import { Signal } from 'micro-signals';

import { MarkerMessage } from './game-types';

// const WEBSOCKET_URL = 'ws://localhost:9000/';
const WEBSOCKET_URL = 'ws://192.168.1.95:9000/';

export default class GameCommunication {
    public onMarkerMessage: Signal<MarkerMessage>;

    private socket?: WebSocket = undefined;

    constructor() {
        this.onMarkerMessage = new Signal<MarkerMessage>();
    }

    public start() {
        console.log('Connecting to WebSocket at', WEBSOCKET_URL);

        this.socket = new WebSocket(WEBSOCKET_URL);
        this.socket.addEventListener('open', (e) => {
            console.log('WebSocket Open', e);
        });

        this.socket.addEventListener('close', (e) => {
            console.log('WebSocket Close', e);
        });

        this.socket.addEventListener('error', (e) => {
            console.log('WebSocket Close', e);
        });

        this.socket.addEventListener('message', (msg) => {
            this.handleMessage(msg);
        });
    }

    private handleMessage(msg: MessageEvent) {
        // console.log('WebSocket Message', msg);

        if (msg.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result !== 'string') {
                    throw new Error('Unable to parse message ' + JSON.stringify(reader.result));
                }

                this.onMessageBlob(reader.result);
            };
            reader.readAsText(msg.data);
        } else if (typeof msg.data === 'string') {
            this.onMessageBlob(msg.data);
        } else {
            console.log('unexpected message data', msg);
        }
    }

    private onMessageBlob(blob: string) {
        const markerMessage = JSON.parse(blob);

        this.onMarkerMessage.dispatch(markerMessage);
    }
}
