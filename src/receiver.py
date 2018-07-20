import numpy as np
import cv2

cap = cv2.VideoCapture("rtp://127.0.0.1:1234", cv2.CAP_FFMPEG)
#cap = cv2.VideoCapture("content-engine/test.sdp")

while(True):
    # Capture frame-by-frame
    ret, frame = cap.read()

    # Our operations on the frame come here
    #gray = cv2.cvtColor(frame, cv2.COLOR_YUV2BGR)

    # Display the resulting frame
    if frame and frame.shape[0] > 0:
        cv2.imshow('frame', frame)
    else:
        print("empty frame")
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# When everything done, release the capture
cap.release()
cv2.destroyAllWindows()
