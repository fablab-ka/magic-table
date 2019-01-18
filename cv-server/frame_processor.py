import cv2
import numpy as np
from scipy.linalg import expm


def rot_euler(v, xyz):
    ''' Rotate vector v (or array of vectors) by the euler angles xyz '''
    # https://stackoverflow.com/questions/6802577/python-rotation-of-3d-vector
    for theta, axis in zip(xyz, np.eye(3)):
        v = np.dot(np.array(v), expm(np.cross(np.eye(3), axis*-theta)))
    return v


# https: // stackoverflow.com/questions/23472048/projecting-3d-points-to-2d-plane
# TODO get coordinates from table marker
table_rvec = [-0.06196796, -2.93237183, -0.46390893]
table_tvec = [-3.55630086, -3.30205484, 36.21805022]
table_norm = rot_euler([0, 0, 1], table_rvec)
table_offset = [0, 0]
table_scale = 1
e_1 = rot_euler([1, 0, 0], table_rvec)
e_2 = rot_euler([0, 1, 0], table_rvec)


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

        position2d = (
            float(np.dot(e_1, tvec[0] -
                         np.array(table_tvec))) + table_offset[0] * table_scale,
            float(np.dot(e_2, tvec[0] -
                         np.array(table_tvec))) + table_offset[1] * table_scale
        )
        # print(position2d)

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
            'transform': transform.tolist(),
            'position2d': position2d,
            'rotation2d': 0
        }
