import threading
import time
import cv2
import sys
import traceback
import numpy as np
import json
from SimpleWebSocketServer import SimpleWebSocketServer, WebSocket

clients = []
server = None
serverRunning = False
[width, height] = (800, 800)
marker_length_in_meter = 1
calibration = np.load('./calibration.npz')
dist_coeffs = calibration['dist_coeffs']
camera_matrix = calibration['camera_matrix']
projector_to_camera_offset = np.array([0, 0, 0])

def send_transforms(clients, transforms):
    message = json.dumps(transforms)
    for client in clients:
        client.sendMessage(message)

def start_camera_analysis():
    print("Starting Camera Analysis")

    cap = cv2.VideoCapture(2)
    dictionary = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_6X6_250)

    while serverRunning:
        ret, frame = cap.read()

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        (markers, ids, n) = cv2.aruco.detectMarkers(gray, dictionary)
        if len(markers) > 0:
            cv2.aruco.drawDetectedMarkers(frame, markers, ids)

            rvecs, tvecs, points = cv2.aruco.estimatePoseSingleMarkers(
                markers,
                marker_length_in_meter,
                camera_matrix,
                dist_coeffs
            )
            # todo matrix multiplication with calibration matrix
            tvecs += projector_to_camera_offset
            #print(rvecs, tvecs, points)
            #print(imgpts)

            transforms = []
            for i in range(len(markers)):
                imgpts, jac = cv2.projectPoints(
                    points, rvecs[i], tvecs[i], camera_matrix, dist_coeffs
                )
                #print('markers', markers)
                #print('imgpts', imgpts)
                transform = cv2.getPerspectiveTransform(
                    np.array(
                        [
                            [0, 0],
                            [width, 0],
                            [width, height],
                            [0, height]
                        ] * len(markers),
                        np.float32
                    ),
                    imgpts
                )
                #print(transform)
                marker_ids = ids[i]

                transforms.append({
                    'marker': imgpts.tolist(),
                    'transform': transform.tolist(),
                    'ids': marker_ids.tolist()
                })

            try:
                clonedClients = clients[:]
            except:
                continue

            send_transforms(clonedClients, transforms)

        cv2.imshow('frame', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            continue


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
