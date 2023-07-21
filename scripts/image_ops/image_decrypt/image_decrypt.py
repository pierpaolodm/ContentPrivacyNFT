#!/usr/bin/env python3

import argparse
from functools import reduce
import json
import subprocess
from pathlib import Path
import cv2

import numpy as np


def get_encrypted_image(root_dir,proof_name = 'image'):
    """
    Get the encrypted image from the snarkjs_circuit folder, it's necessary that tiles must be written in folder as [proof_name]_0 ... [proof_name]_n.
    :param root_dir: The root directory of the project that contains snarkjs_circuit folder.
    :param proof_name: The name of the proof.
    :return: List with the paths to the encrypted tile image.
    """
    public_json_paths = []
    snarkjs_circuit_path = Path(root_dir) / "snarkjs_circuit"

    for proof_dir in snarkjs_circuit_path.iterdir():

        if proof_dir.is_dir() and proof_dir.name.startswith(proof_name):
            public_json_file = proof_dir / "public.json"

            if public_json_file.is_file():
                public_json_paths.append(public_json_file.resolve())

    return sorted(public_json_paths, key=lambda x: int(str(x).split(f'{proof_name}_')[1][0]))


    
def compile_ciminion_dec(base_path = './scripts/image_ops/image_decrypt/ciminion_decrypt/src'):  
    """
    Compile the ciminion_decrypt program
    :param base_path: The base path of the ciminion_decrypt program.
    :return: Path to the ciminion_decrypt program.
    """
    if (Path(base_path).parent / 'bin/ciminion_decrypt').is_file():
        return (Path(base_path).parent / 'bin/ciminion_decrypt').resolve()
    
    
    subprocess.run(['g++', '-I./include', '-Wall', '-g', '-O2', '-std=c++11', '-pthread', '-march=native', '-c', 'main.cpp', '-o', 'main.o'], cwd=base_path)
    subprocess.run(['g++', '-o', 'ciminion_decrypt', 'main.o', '-lntl', '-lgmp', '-lm', '-lpthread'], cwd=base_path)
    subprocess.run(['mkdir', '-p', '../bin'], cwd=base_path)
    subprocess.run(['mv', 'ciminion_decrypt', '../bin/'], cwd=base_path)
    subprocess.run(['rm', 'main.o'], cwd=base_path)


    return (Path(base_path).parent / 'bin/ciminion_decrypt').resolve()


def decrypt_tile(enc_tile_path,ciphertext_shape, master_keys):
    """
    Decrypt a tile image using ciminion_decrypt program
    :param enc_tile_path: Path to the encrypted tile image.
    :param ciphertext_shape: Shape of the ciphertext.
    :param master_keys: List with the two master keys, for ciminion authencated encryption scheme.
    :return: Decrypted tile image.
    """
    dec_path = compile_ciminion_dec()

    image_string = subprocess.getoutput(f'{dec_path} {enc_tile_path} {reduce(lambda x,y:x*y,ciphertext_shape)} {master_keys[0]} {master_keys[1]}')
    image = image_string.replace("[", "").replace("]", "").replace("'", "")
    image = np.array(image.split(',')).astype(int)
    image =  np.reshape(image, ciphertext_shape)
    return image

def decrypt_image(parameters_path, full_shape, output_path = './output/decrypted_image.png',base_name = 'image'):
    """
    Decrypt an image using ciminion_decrypt program
    :param parameters_path: Path to the parameters.json file, that contains at least the master keys.
    :param full_shape: Shape of the full image.
    :param output_path: Path to the output file.
    :param base_name: The name of the proof.
    :return: Decrypted image.
    """
    json_tiles = get_encrypted_image('./output',base_name)
    decrypted_tiles = list()
    dim = full_shape.index(min((full_shape[0],full_shape[1])))
    with open(parameters_path, 'r') as file:
        parameters = json.load(file)


    for idx,tile in enumerate(json_tiles):
        if idx != len(json_tiles)-1:
            shape_x = full_shape[0] // len(json_tiles) if dim == 0 else full_shape[0]
            shape_y = full_shape[1] // len(json_tiles) if dim == 1 else full_shape[1]
        else:
            shape_x = full_shape[0] - (full_shape[0] // len(json_tiles)) * (len(json_tiles)-1) if dim == 0 else full_shape[0]
            shape_y = full_shape[1] - (full_shape[1] // len(json_tiles)) * (len(json_tiles)-1) if dim == 1 else full_shape[1]

        shape = (shape_x,shape_y,full_shape[2])
        decrypted_tiles.append(decrypt_tile(tile, shape, parameters['ciminion_keys']))

    image = np.concatenate(decrypted_tiles, axis=dim)

    if output_path is not None:
        cv2.imwrite(output_path, image)
    return image


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Decrypt an image using ciminion_decrypt program')
    parser.add_argument('--parameters', type=str, help='Path to the parameters.json file, that contains at least the master keys.')
    parser.add_argument('--full-shape', type=str, help='Shape of the full image in the form i.e 64x64x3.')
    parser.add_argument('--output-path', type=str, default='./output/decrypted_image.png', help='Path to the output file.')
    parser.add_argument('--base-name', type=str, default='image', help='The base name of the proof folder, for all the tiles.')
    
    args = parser.parse_args()
    full_shape = tuple(map(int, args.full_shape.split('x')))
    decrypt_image(args.parameters, full_shape, args.output_path)


# ./scripts/image_ops/image_decrypt/image_decrypt.py --parameters ./input/parameters.json --full-shape 64x64x3   