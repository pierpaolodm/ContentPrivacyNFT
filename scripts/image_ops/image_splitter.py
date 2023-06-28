#!/usr/bin/env python3

import os
import cv2
from scripts.image_ops.image_transformation import extract_image_vector



def slice_image(image_path, pixels, save_tiles=None, dimension=None):
    """
    Slice an image into tiles of size pixels x pixels
    :param image_path: path to image
    :param pixels: number of pixels to divide in the gratest dimension of the frame
    :param save_tiles: path to save tiles
    :param dimension: 0 for height, 1 for width
    :return: dictionary with tiles, rows, cols, height, width
    """
    image = cv2.imread(image_path)
    height, width, _ = image.shape

    dimension = (height,width).index(max(height, width)) if dimension is None else dimension

    dimension_max = height if dimension == 0 else width

    num_frame = dimension_max // pixels
    remaining_pixels = dimension_max % pixels

    frame_list = [image[(i * pixels):((i + 1) * pixels), :] if dimension == 0 else 
                  image[:, (i * pixels):((i + 1) * pixels)] 
                  for i in range(num_frame)]
    
    if remaining_pixels > 0:
        last_frame = image[(num_frame * pixels):(num_frame * pixels + remaining_pixels), :] if dimension == 0 else \
                     image[:, (num_frame * pixels):(num_frame * pixels + remaining_pixels)]
        frame_list.append(last_frame)
    
    if save_tiles is not None:
        os.makedirs(save_tiles, exist_ok=True)
        [cv2.imwrite(os.path.join(save_tiles, f'tile_{i}.png'), frame_list[i]) for i in range(len(frame_list))]
    
    return frame_list


def max_pixels_per_frame(image_path, threshold=128**2*3):
    """
    Calculate the maximum number of pixels per frame
    :param image_path: path to image
    :param threshold: threshold to consider the image as a frame
    :return: dimension to divide the frame and the number of pixels to divide the frame
    """
    image = extract_image_vector(image_path)
    height, width, _ = image.shape
    
    return (height, width).index(max(height, width)), threshold // ((min(height, width))*3)



if __name__ == '__main__':
    raise ValueError('This script is not meant to be run directly.')
 