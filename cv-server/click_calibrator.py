# import the necessary packages
import argparse
import numpy
import cv2

# initialize the list of reference points and counter with current position
rectangles = []
all_pts = []  # type: List[List[Tuple[int, int]] * 4]
current_pt_nr = 0
current_pts = []
# calib_step = 'idle'  # type: Union['idle', 'selecting', 'calibrating']

homography = numpy.eye(3, 3)
show_warped = False

dinA4 = ((0, 0), (0, 210), (297, 210), (297, 0))


def get_homography():
    global homography
    homography, mask = cv2.findHomography(
        srcPoints=numpy.array(rectangles[0]),
        dstPoints=numpy.array(rectangles[1])
    )
    print("Transformation: ", homography)


def show_image(image):
    # print('showing image  ', image.shape)
    # print('homography: ', homography)
    # flags = cv2.INTER_LINEAR + 8 #(CV_WARP_FILL_OUTLIERS) # + 16 #(CV_WARP_INVERSE_MAP)
    if show_warped:
        print('warped')
        canvas = cv2.warpPerspective(
            image,
            homography,
            (1920, 1080)
        )
        cv2.imshow("image", canvas)
    else:
        cv2.imshow("image", image)


def click_and_store(event, x, y, flags, param):
    # grab references to the global variables
    global all_pts, current_pt_nr, current_pts

    if event == cv2.EVENT_LBUTTONDOWN:
        if len(rectangles) >= 2:
            return

        current_pt_nr += 1
        current_pts.append((x, y))
        all_pts.append((x, y))
        if current_pt_nr == 4:  # we're still selecting corners ...
            points = numpy.array(current_pts, dtype=numpy.int32)
            print("Points:", points)
            rectangles.append(points)
            current_pt_nr = 0
            current_pts = []

            if len(rectangles) == 2:
                get_homography()

        # cv2.imshow("image", image)
        # show_image(image)

    # check to see if the left mouse button was released
    # elif event == cv2.EVENT_LBUTTONUP:


# construct the argument parser and parse the arguments
ap = argparse.ArgumentParser()
# ap.add_argument("-i", "--image", required=True, help="Path to the image")
args = vars(ap.parse_args())

# load the image, clone it, and setup the mouse callback function
# image = cv2.imread(args["image"])
# clone = image.copy()

# image = numpy.array((1080, 1920, 3), dtype=numpy.uint8)


wnd_name = 'image'
cv2.namedWindow(wnd_name, 0)
cv2.resizeWindow(wnd_name, 1920, 1080)
cv2.setWindowProperty(wnd_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

# cv2.moveWindow( self.wnd_name, self.pos_x+self.offset_x , self.pos_y+self.offset_y )

cv2.setMouseCallback(wnd_name, click_and_store)

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)


# keep looping until the 'q' key is pressed
while True:
    ret, image = cap.read()

    for p in all_pts:
        cv2.circle(image, (p[0], p[1]), 2, (0, 0, 255), thickness=2)

    for rect in rectangles:
        cv2.polylines(image, [rect], isClosed=True, color=(255, 0, 0))

    # display the image and wait for a keypress
    show_image(image)
    key = '%c' % (cv2.waitKey(1) & 0xFF)

    # if the 'r' key is pressed, reset the cropping region
    if key is 'r':
        all_pts = []
        rectangles = []

    # toggle between warped and unwarped projection
    if key is 'w':
        print("warp it!")
        show_warped = not show_warped

    # if the 'q' key is pressed, break from the loop
    elif key in ['q', '\x1b']:
        break

# if there are two reference points, then crop the region of interest
# from teh image and display it
# if len(all_pts) == 2:
    # roi = clone[all_pts[0][1]:all_pts[1][1], all_pts[0][0]:all_pts[1][0]]
    # cv2.imshow("ROI", roi)
    # cv2.waitKey(0)

# close all open windows
cv2.destroyAllWindows()
