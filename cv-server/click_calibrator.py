# import the necessary packages
import argparse
import numpy
import cv2

# initialize the list of reference points and counter with current position
all_pts = []  # type: List[List[Tuple[int, int]] * 4]
current_pt_nr = 0 
current_pts = []
# calib_step = 'idle'  # type: Union['idle', 'selecting', 'calibrating']

homography = numpy.eye(3, 3)
show_warped = False

dinA4 = ((0,0), (0,210), (297,210), (297,0))

def get_homography():
	global homography
	homography, mask = cv2.findHomography(
            srcPoints=numpy.array(dinA4), 
            dstPoints=numpy.array(all_pts[0]) 
        )
	print("Transformation: ", homography)

def click_and_store(event, x, y, flags, param):
	# grab references to the global variables
	global all_pts, current_pt_nr, current_pts

	if event == cv2.EVENT_LBUTTONDOWN:
		current_pt_nr += 1
		current_pts.append((x, y))
		cv2.circle(image, (x ,y), 2, (0, 0, 255), thickness=2)
		if current_pt_nr == 4:  # we're still selecting corners ...
			points = numpy.array(current_pts, dtype=numpy.int32)
			print("Points:", points)
			cv2.polylines(image, [points], isClosed=True, color=(255, 0, 0))
			all_pts.append(points)
			current_pt_nr = 0
			current_pts = []
			get_homography()

		cv2.imshow("image", image)

	# check to see if the left mouse button was released
	# elif event == cv2.EVENT_LBUTTONUP:

def show_image(image):
	print('showing image')
	print('homography: ', homography)
	flags = cv2.INTER_LINEAR + 8 #(CV_WARP_FILL_OUTLIERS) # + 16 #(CV_WARP_INVERSE_MAP)
	canvas = cv2.warpPerspective( 
		image, 
		homography,
		(800, 600)
	)
	cv2.imshow("image", canvas)

# construct the argument parser and parse the arguments
ap = argparse.ArgumentParser()
ap.add_argument("-i", "--image", required=True, help="Path to the image")
args = vars(ap.parse_args())

# load the image, clone it, and setup the mouse callback function
image = cv2.imread(args["image"])
clone = image.copy()
cv2.namedWindow("image")
cv2.setMouseCallback("image", click_and_store)

# keep looping until the 'q' key is pressed
while True:
	# display the image and wait for a keypress
	show_image(image)
	key = '%c' % (cv2.waitKey(0) & 0xFF)

	# if the 'r' key is pressed, reset the cropping region
	if key is 'r':
		image = clone.copy()

	# toggle between warped and unwarped projection
	elif key is 'w':
		show_warped = not show_warped

	# if the 'q' key is pressed, break from the loop
	elif key in ['q', '\x1b']:
		break

# if there are two reference points, then crop the region of interest
# from teh image and display it
if len(all_pts) == 2:
	roi = clone[all_pts[0][1]:all_pts[1][1], all_pts[0][0]:all_pts[1][0]]
	cv2.imshow("ROI", roi)
	cv2.waitKey(0)

# close all open windows
cv2.destroyAllWindows()