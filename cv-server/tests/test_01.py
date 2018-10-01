import pprint
import cv2
import sys
import numpy as np
sys.path.append("..")
from frame_processor import FrameProcessor

pp = pprint.PrettyPrinter(indent=4)

print("===== Testing a simple transform =========================================")

calibration = np.load('../calibration_1080.npz')
frame_processor = FrameProcessor(calibration)
frame_processor.frame = cv2.imread('./test_01.png')
transforms = frame_processor.proccess()
pp.pprint(transforms)

print("===== DONE ===============================================================")
