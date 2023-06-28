#!/usr/bin/env python3

from pathlib import Path
import cv2
import numpy as np
import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
import tensorflow as tf

def extract_image_vector(image_path):
    return cv2.imread(image_path,cv2.IMREAD_COLOR)


def crop_image(image_path, height, width, x=0, y=0,output_path=None):
    """
    Crop an image to the given dimensions.
    :param image_path: Path to the image to crop.
    :param height: Height of the cropped image.
    :param width: Width of the cropped image.
    :param output_path: Path where to save the cropped image.
    :param x: x coordinate of the top left corner of the cropped image.
    :param y: y coordinate of the top left corner of the cropped image.
    :return: Path to the cropped image and vectorized image.
    """
    if output_path is None:
        canonical_path = str(Path(image_path).resolve())
        output_path = canonical_path.split(".")[0] + "_cropped.png"

    image = extract_image_vector(image_path)
    image = image[y : y + height, x : x + width]
    cv2.imwrite(output_path, image)

    return output_path,image


def resize_image(image_path, height, width, output_path=None):
    """
    Resize an image to the given dimensions.
    :param image_path: Path to the image to resize.
    :param height: Height of the resized image.
    :param width: Width of the resized image.
    :param output_path: Path where to save the resized image.
    :return: Path to the resized image and vectorized image.
    """

    image = extract_image_vector(image_path)
    original_height, original_width, _ = image.shape

    if (original_height-1) % (height-1) != 0 or (original_width-1) % (width-1) != 0:
        divisors_h = [v+1 for v in range(1, (original_height - 1)//2) if (original_height - 1) % v == 0]
        divisors_w = [v+1 for v in range(1, (original_width - 1)//2) if (original_width - 1) % v == 0]
        raise ValueError(f"The image cannot be resized to the given dimensions.\n The height must be one of this numbers: {divisors_h}\
                          \n The width must be one of this numbers: {divisors_w}")

    image = (
        (
            tf.compat.v1.image.resize(
                image,
                [height, width],
                align_corners=True,
                method=tf.image.ResizeMethod.BILINEAR,
            )
        )
        .numpy()
        .round()
        .astype(np.uint8)
    )
    if output_path is not None:
        cv2.imwrite(output_path, image)
    return output_path,image


if __name__ == "__main__":
    raise ValueError('This script is not meant to be run directly.')
