import threading
import time
import cv2
import numpy as np

from SimpleWebSocketServer import SimpleWebSocketServer, WebSocket

clients = []
server = None


class SimpleWSServer(WebSocket):

    def handleMessage(self):
        print("WS message", len(self.data))
        img = np.array(self.data)
        cv2.imshow('window', img)

    def handleConnected(self):
        print("WS connected")
        clients.append(self)

    def handleClose(self):
        print("WS disconnected")
        clients.remove(self)

def run_server():
    global server
    server = SimpleWebSocketServer('', 9000, SimpleWSServer, selectInterval=(1000.0 / 15) / 1000)
    server.serveforever()


def main():
    run_event = threading.Event()
    run_event.set()

    t = threading.Thread(target=run_server)
    t.start()

    try:
        while 1:
            time.sleep(.1)
    except KeyboardInterrupt:
        run_event.clear()
        t.join()
        print("threads successfully closed")


if __name__ == '__main__':
    run_server()
