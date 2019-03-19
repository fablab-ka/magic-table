import cv2
import math
import numpy as np
from numpy.linalg import inv, norm

projector_homography = np.array([[9.47185260e-01, -2.15271392e-01,  2.68048189e+01],
                                 [2.46967749e-03,  8.44429106e-01,  3.05534059e+01],
                                 [4.67473582e-05, -2.35363909e-04,  1.00000000e+00]], dtype=np.float64)

pixel_per_meter = 100/0.102


class FrameProcessor:
    def __init__(self, calibration):
        self.camera_index = 2
        self.marker_length_in_meter = 0.04
        self.projector_to_camera_offset = np.array([0, 0, 0])

        self.debug = True

        self.dist_coeffs = calibration['dist_coeffs']
        self.camera_matrix = calibration['camera_matrix']

        self.dictionary = cv2.aruco.getPredefinedDictionary(
            cv2.aruco.DICT_6X6_250)

        if self.debug:
            wnd_name = 'frame'
            cv2.namedWindow(wnd_name, 0)
            cv2.resizeWindow(wnd_name, 1920, 1080)
            cv2.setWindowProperty(
                wnd_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

    def init_camera(self):
        self.cap = cv2.VideoCapture(self.camera_index)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)

    def capture(self):
        ret, self.frame = self.cap.read()
        return ret

    def proccess(self):
        result = []

        gray = cv2.cvtColor(self.frame, cv2.COLOR_BGR2GRAY)
        (markers, ids, n) = cv2.aruco.detectMarkers(gray, self.dictionary)
        if len(markers) > 0:
            cv2.aruco.drawDetectedMarkers(self.frame, markers, ids)

            self.frame = cv2.warpPerspective(
                self.frame,
                projector_homography,
                (1920, 1080)
            )

            for i in range(len(markers)):
                # imgpts = cv2.perspectiveTransform(
                #     markers[i], projector_homography)
                marker_points = []
                for j in range(len(markers[i][0])):
                    p = markers[i][0][j]
                    imgpts = np.dot(projector_homography,
                                    np.array([p[0], p[1], 1]))
                    warped_point = (
                        int(imgpts[0] / imgpts[2]), int(imgpts[1] / imgpts[2]))
                    marker_points.append(warped_point)

                    if self.debug:
                        cv2.circle(self.frame, warped_point, 2,
                                   (0, 0, 255), thickness=2)

                center_point = np.sum(np.array(marker_points), axis=0)/4
                if self.debug:
                    cv2.circle(self.frame, tuple(center_point.astype(int)), 2,
                               (0, 255, 0), thickness=2)

                v1 = np.array(marker_points[0]) - np.array(marker_points[1])
                v2 = np.array(marker_points[3]) - np.array(marker_points[2])
                direction = (v1 + v2) / 2
                if self.debug:
                    cv2.line(self.frame, tuple(center_point.astype(int)), tuple((center_point + direction).astype(int)),
                             (0, 255, 0), thickness=2)

                result.append({
                    'corners': marker_points,
                    'id': ids[i][0].tolist(),
                    'position': center_point.tolist(),
                    'direction': direction.tolist(),
                    'rotation': math.atan2(direction[1], direction[0])
                })
        else:
            self.frame = cv2.warpPerspective(
                self.frame,
                projector_homography,
                (1920, 1080)
            )

        if self.debug:
            cv2.imshow('frame', self.frame)

        return result
