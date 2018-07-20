import threading
import time
import cv2
import sys
import traceback
import numpy as np
import subprocess as sp

from SimpleWebSocketServer import SimpleWebSocketServer, WebSocket

clients = []
server = None
ffmpeg = None


class SimpleWSServer(WebSocket):

    def handleMessage(self):
        print("WS message", len(self.data))

        #bmpData = ffmpeg.communicate(input=self.data)[0]

        try:
            #print("bmpData read", len(bmpData))
            #image = cv2.imdecode(np.fromstring(bmpData, dtype=np.uint8), 1)

            nparr = np.asarray(self.data, np.uint8)

            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            print("img decoded", image.shape)

            cv2.imshow('window', image)
        except Exception as e:
            print(e)
            traceback.print_exc(file=sys.stdout)

    def handleConnected(self):
        print("WS connected")
        clients.append(self)

    def handleClose(self):
        print("WS disconnected")
        clients.remove(self)

def run_server():
    global server, ffmpeg

    print("Starting ffmpeg")
    ffmpegCmd = ['ffmpeg', '-i', '-', '-f', 'rawvideo',
                 '-vcodec', 'bmp', '-vf', 'fps=5', '-']

    ffmpeg = sp.Popen(ffmpegCmd, stdin=sp.PIPE, stdout=sp.PIPE)

    print("Starting Server")

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
