import threading
import time
import cv2
import sys
import traceback
import numpy as np

from SimpleWebSocketServer import SimpleWebSocketServer, WebSocket

clients = []
server = None
serverRunning = False


def sendTransforms(clients, transforms):
    transformMessage = '['
    for transform in transforms:
        transformMessage += '{ left: ' + str(transform[0][0][0]) + ','
        transformMessage += ' top: ' + str(transform[0][0][1]) + ','
        transformMessage += ' right: ' + str(transform[0][1][0]) + ','
        transformMessage += ' bottom: ' + str(transform[0][2][1]) + ' } '
    transformMessage += ']'

    for client in clients:
        client.sendMessage(transformMessage)

def start_camera_analysis():
    print("Starting Camera Analysis")

    cap = cv2.VideoCapture(0)
    dictionary = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_6X6_250)

    while serverRunning:

        ret, frame = cap.read()
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        (markers, ids, n) = cv2.aruco.detectMarkers(gray, dictionary)
        if len(markers) > 0:
            transforms = []

            for marker in markers:
                left = marker[0][0][0]
                top = marker[0][0][1]
                right = marker[0][1][0]
                bottom = marker[0][2][1]
                width = right - left
                height = bottom - top

                # transform = cv2.getPerspectiveTransform(
                #     np.array([[0, 0], [ball_img.shape[1], 0], [
                #             ball_img.shape[1], ball_img.shape[0]], [0, ball_img.shape[0]]], np.float32),
                #     marker
                # )

                transforms.append(marker)

            try:
                clonedClients = clients[:]
            except:
                continue

            sendTransforms(clonedClients, transforms)

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
    global server, serverRunning

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


if __name__ == '__main__':
    run_server()
