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
    width = img.shape[1]
    alpha = img[0:height, 0:width, 3] / 255.0

    for c in range(0, 3):
        color = img[0:height, 0:width, c] * (1.0-alpha)
        beta = frame[oy:oy+height, ox:ox+width, c] * (1.0 - alpha)

        frame[oy:oy+height, ox:ox+width, c] = color + beta


while(True):
    ret, frame = cap.read()

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    (corners, ids, n) = cv2.aruco.detectMarkers(gray, dictionary)

    if len(corners) > 0:
        cv2.aruco.drawDetectedMarkers(frame, corners, ids)

        transform = cv2.getPerspectiveTransform(corners[0], np.array([[0, 0], [frame.shape[0], 0], [frame.shape[0], frame.shape[1]], [0, frame.shape[1]]], np.float32))
        warped_ball_img = cv2.warpPerspective(
            ball_img, transform, dsize=(ball_img.shape[1], ball_img.shape[0]), flags=cv2.INTER_LINEAR)

        draw_image(warped_ball_img, frame, int(corners[0][0][0][0]), int(corners[0][0][0][1]))

    cv2.imshow('frame', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# When everything done, release the capture
cap.release()
cv2.destroyAllWindows()


