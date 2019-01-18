import cv2
import numpy as np
from numpy.linalg import inv

projector_homography = np.array([[9.47185260e-01, -2.15271392e-01,  2.68048189e+01],
                                 [2.46967749e-03,  8.44429106e-01,  3.05534059e+01],
                                 [4.67473582e-05, -2.35363909e-04,  1.00000000e+00]])

pixel_per_meter = 100/0.102


class FrameProcessor:
    def __init__(self, calibration):
        self.camera_index = 0
        self.marker_length_in_meter = 0.04
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

    def toMarkerData(self, imgpts, idlist, transform, position2d, rotation2D):
        return {
            'marker': imgpts.tolist(),
            'ids': idlist.tolist(),
            'transform': transform.tolist(),
            'position2d': position2d,
            'rotation2d': rotation2D
        }

    def projectPoints(self, points, rvec, tvec):
        imgpts, jac = cv2.projectPoints(
            points, rvec, tvec, self.camera_matrix, self.dist_coeffs
        )
        return imgpts

    def getPerspectiveTransform(self, imgpts):
        width, height = 0.04 * pixel_per_meter, 0.04 * pixel_per_meter
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

        return transform

    def calculate_position_2d(self, transform):
        return (0, 0)

    def calculate_rotation_2d(self, transform):
        return 0

    def marker_to_transform_data(self, points, rvec, tvec, idlist):
        imgpts = self.projectPoints(points, rvec, tvec)
        transform = self.getPerspectiveTransform(imgpts)
        position2d = self.calculate_position_2d(transform)
        rotation2d = self.calculate_rotation_2d(transform)

        imgpts = cv2.perspectiveTransform(imgpts, projector_homography)

        return self.toMarkerData(imgpts, idlist, transform, position2d, rotation2d)
