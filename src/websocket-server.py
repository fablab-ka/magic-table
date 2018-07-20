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
serverRunning = False

width = 1024
height = 768


def start_camera_analysis():
    print("Starting Camera Analysis")

    while serverRunning:
        try:
            clonedClients = clients[:]
        except:
            continue

        for client in clonedClients:
            client.sendMessage('it\'s a message')

    print("Stopping Camera Analysis")


class SimpleWebSocket(WebSocket):

    def handleMessage(self):
        print("WS message", len(self.data))

        #bmpData, errors = ffmpeg.communicate(input=self.data)

        #try:
            #print("bmpData read", len(bmpData))
            #image = cv2.imdecode(np.frombuffer(bmpData, dtype=np.uint8), 1)

            #nparr = np.asarray(self.data, np.uint8)

            #print(nparr)

            #image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            #print("img decoded", image.shape)

            #cv2.imshow('window', image)
        # except Exception as e:
        #     print(e)
        #     traceback.print_exc(file=sys.stdout)

    def handleConnected(self):
        print("WS connected")
        clients.append(self)

    def handleClose(self):
        print("WS disconnected")
        clients.remove(self)


def run_server():
    global server, ffmpeg, serverRunning

    print("Starting ffmpeg")
    ffmpegCmd = ['ffmpeg', '-i', '-', '-f', 'rawvideo',
                 '-vcodec', 'bmp', '-vf', 'fps=5', '-']

    # ffmpeg = sp.Popen(ffmpegCmd, stdin=sp.PIPE, stdout=sp.PIPE)

    print("Starting Server")

    server = SimpleWebSocketServer('', 9000, SimpleWebSocket, selectInterval=(1000.0 / 15) / 1000)

    serverRunning = True

    analysisThread = threading.Thread(target=start_camera_analysis)
    analysisThread.start()

    try:
        server.serveforever()
    except KeyboardInterrupt:
        serverRunning = False
        analysisThread.join()


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
