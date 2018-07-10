import numpy as np
import cv2

cap = cv2.VideoCapture(0)
#dictionary = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_5X5_1000)
#dictionary = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
#dictionary = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_ARUCO_ORIGINAL)
dictionary = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_6X6_250)

ball_img = cv2.imread("ball.png", -1)
ball_img = cv2.resize(ball_img, (400, 400))


def draw_image(img, frame, ox, oy):
    height = img.shape[0]
    if oy + height > frame.shape[0]:
        height = frame.shape[0] - oy
    width = img.shape[1]
    if ox + width > frame.shape[1]:
        width = frame.shape[1] - ox

    alpha = img[0:height, 0:width, 3] / 255.0

    for c in range(0, 3):
        color = img[0:height, 0:width, c] * (alpha)
        beta = frame[oy:oy+height, ox:ox+width, c] * (1.0 - alpha)

        frame[oy:oy+height, ox:ox+width, c] = color + beta


while(True):
    ret, frame = cap.read()

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    (markers, ids, n) = cv2.aruco.detectMarkers(gray, dictionary)

    if len(markers) > 0:
        cv2.aruco.drawDetectedMarkers(frame, markers, ids)

        for marker in markers:
            left = marker[0][0][0]
            top = marker[0][0][1]
            right = marker[0][1][0]
            bottom = marker[0][2][1]
            width = right - left
            height = bottom - top

            transform = cv2.getPerspectiveTransform(
                np.array([[0, 0], [ball_img.shape[1], 0], [ball_img.shape[1], ball_img.shape[0]], [0, ball_img.shape[0]]], np.float32),
                marker
            )
            warped_ball_img = cv2.warpPerspective(
                ball_img, transform, dsize=(ball_img.shape[1], ball_img.shape[0]), flags=cv2.INTER_LINEAR)
            draw_image(warped_ball_img, frame, 0, 0)

    cv2.imshow('frame', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# When everything done, release the capture
cap.release()
cv2.destroyAllWindows()


