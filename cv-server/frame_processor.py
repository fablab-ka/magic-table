import cv2
import numpy as np


class FrameProcessor:
    def __init__(self, calibration):
        self.camera_index = 0
        self.marker_length_in_meter = 1
        self.projector_to_camera_offset = np.array([0, 0, 0])

        self.dist_coeffs = calibration['dist_coeffs']
        self.camera_matrix = calibration['camera_matrix']

        self.dictionary = cv2.aruco.getPredefinedDictionary(
            cv2.aruco.DICT_6X6_250)

    def init_camera(self):
        self.cap = cv2.VideoCapture(self.camera_index)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)

    def capture(self):
        ret, self.frame = self.cap.read()
        return ret

    def proccess(self):
        result = None

        gray = cv2.cvtColor(self.frame, cv2.COLOR_BGR2GRAY)
        (markers, ids, n) = cv2.aruco.detectMarkers(gray, self.dictionary)
        if len(markers) > 0:
            cv2.aruco.drawDetectedMarkers(self.frame, markers, ids)

            result = self.calculate_transforms(markers, ids)

        return result

    def calculate_transforms(self, markers, ids):
        result = []

        rvecs, tvecs, points = cv2.aruco.estimatePoseSingleMarkers(
            markers,
            self.marker_length_in_meter,
            self.camera_matrix,
            self.dist_coeffs
        )
        # todo matrix multiplication with calibration matrix
        tvecs += self.projector_to_camera_offset

        result = []
        # print(ids)
        for i in range(len(markers)):
            result.append(self.marker_to_transform_data(
                points, rvecs[i], tvecs[i], ids[i]))

        return result

    def marker_to_transform_data(self, points, rvec, tvec, idlist):
        imgpts, jac = cv2.projectPoints(
            points, rvec, tvec, self.camera_matrix, self.dist_coeffs
        )

        # print(points)
        width, height = 800, 800
        transform = cv2.getPerspectiveTransform(
            np.array(
                [
                    [0, 0],
                    [width, 0],
                    [width, height],
                    [0, height]
                ],
                np.float32
            ),
            imgpts
        )
        # print(idlist)

        return {
            'marker': imgpts.tolist(),
            'ids': idlist.tolist(),
            'transform': transform.tolist()
        }
