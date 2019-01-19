import threading
import time
import cv2
import sys
import traceback
import numpy as np
import json
from SimpleWebSocketServer import SimpleWebSocketServer, WebSocket
from frame_processor import FrameProcessor

clients = []
server = None
server_running = False


def send_transforms(clients, transforms):
    message = json.dumps(transforms)
    for client in clients:
        client.sendMessage(message)


def start_camera_analysis():
    print("Starting Camera Analysis")

    calibration = np.load('./calibration_1080.npz')
    frame_processor = FrameProcessor(calibration)
    frame_processor.init_camera()

    while server_running:
        frame_processor.capture()
        transforms = frame_processor.proccess()
        if transforms:
            try:
                cloned_clients = clients[:]
            except:
                continue

            send_transforms(cloned_clients, transforms)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            continue

    print("Stopping Camera Analysis")


class SimpleWebSocket(WebSocket):
    def handleMessage(self):
        print("WS message", len(self.data))

    def handleConnected(self):
        print("WS connected")
        clients.append(self)

    def handleClose(self):
        print("WS disconnected")
        clients.remove(self)


def run_server():
    global server, server_running

    print("Starting Server")

    server = SimpleWebSocketServer(
        '', 9000, SimpleWebSocket, selectInterval=(1000.0 / 15) / 1000)

    server_running = True

    analysis_thread = threading.Thread(target=start_camera_analysis)
    analysis_thread.start()

    try:
        server.serveforever()
    except KeyboardInterrupt:
        server_running = False
        analysis_thread.join()


if __name__ == '__main__':
    run_server()
