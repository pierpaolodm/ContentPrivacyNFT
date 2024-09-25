from csv import DictWriter
import json
import os
from pathlib import Path
import secrets
import subprocess
import cv2
import numpy as np
import requests
from pathlib import Path
from alive_progress import alive_bar
import re
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
import tensorflow as tf


GREEN_TEXT = "\033[32m"
RESET_COLOR = "\033[0m"


def measure_command(command, time = True, memory = True):
    """
    Measure the time and memory usage of a specified command.

    :param command: The command to execute and measure.
    :param time: True if you want to measure time, False otherwise.
    :param memory: True if you want to measure memory usage, False otherwise.

    :return: A tuple containing the elapsed time (if time=True) and memory usage (if memory=True).
    """
    command = f'/usr/bin/time -p -f "%e %M" {command} > /dev/null'

    process = subprocess.Popen(command, 
                               shell=True,
                               stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE)
    

    command_output = process.communicate()[1].decode('utf-8')
    print(command_output)
    numbers = re.findall(r"(\d+\.\d+|\d+)", command_output)
    t,mem =  tuple(numbers[-2:]) #command_output.split('\n')[0].split(' ')
    t = float(t)
    m = float(mem)
    
    return t if time else None, m if memory else None

def generate_circuit(info, circuit_template, id = None):
    """
    Generate a circuit from a template
    :param info: dictionary with the information to replace in the template
    :param circuit_template: path to the template
    :param id: id of the circuit

    """
    out_circuit = circuit_template.split('/')[-1].split('.')[0]
    os.makedirs('circuits/benchmark',exist_ok=True)

    with open(circuit_template, 'r') as infile:
        circuit = infile.read()
        for k,v in info.items():
            circuit = circuit.replace(k, str(v))
        circuit = circuit.replace('//MAIN', '')
        
        id = f'_{id}' if id is not None else ''
        out_path = f'circuits/benchmark/{out_circuit}{id}.circom'
        with open(out_path, 'w') as outfile:
            outfile.write(circuit)
    return out_path



def generate_random_image(height, width = None):
    """
    Generate a random image.
    :param height: Height of the image.
    :param width: Width of the image.
    :return: the random image.
    """
    if width is None:
        width = height
    rimg =  np.random.randint(0, 256, size=(height, width, 3), dtype=np.uint8)
    return rimg

def generate_input(output_path,f_height,f_width,r_height, r_width, commitment_randomness,master_keys):
    """
    Generate the input for the circuit and save it to a json file
    :param output_path: path to the output file
    :param full_image: full image
    :param low_image: low image
    :param commitment_randomness: randomness used to generate the commitment
    :param master_keys: list with the two master keys for the ciminion authenticated encryption scheme
    """

    img = generate_random_image(f_height,f_width)
    rsz = resize_image(img,r_height,r_width)
    json_input = {'master_key0':str(master_keys[0]),
                  'master_key1':str(master_keys[1]),
                  'nonce':str(generate_random_field_element()),
                  'IV':str(generate_random_field_element()),
                  'randomness':str(commitment_randomness),
                  'full_image':img.astype(str).tolist(), 
                  'resize_image':rsz.astype(str).tolist() }
    with open(output_path, 'w') as outfile:
        json.dump(json_input, outfile)

def parse_operation(operation):
    """
    Parse the operation to perform on the image
    :param operation: string with the operation to perform
    :return: tuple with the operation and the information to perform it
    """
    op,infos = operation.split('_',1)
    if op == 'resize':
        height,width = infos.split('x')
        return op,{'height':int(height),'width':int(width)}
    
    if op == 'crop':
        height,width,start_x,start_y = infos.split('x')
        return op,{'height':int(height),'width':int(width),'start_x':int(start_x),'start_y':int(start_y)}

def resize_image(image, height, width):
    """
    Resize an image to the given dimensions.
    :param image_path: Path to the image to resize.
    :param height: Height of the resized image.
    :param width: Width of the resized image.
    :return: the resized image.
    """
    original_height, original_width, _ = image.shape

    if (original_height-1) % (height-1) != 0 or (original_width-1) % (width-1) != 0:
        divisors_h = [v+1 for v in range(1, (original_height - 1)//2) if (original_height - 1) % v == 0]
        divisors_w = [v+1 for v in range(1, (original_width - 1)//2) if (original_width - 1) % v == 0]
        raise ValueError(f"The image cannot be resized to the given dimensions.\n The height must be one of this numbers: {divisors_h}\
                          \n The width must be one of this numbers: {divisors_w}")

    return (
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

def append_to_csv(row,csv_path):
    """
    Append a row to a csv file if it exists, otherwise create it
    :param row: dictionary with the row to append
    :param csv_path: path to the csv file
    """
    with open(csv_path, 'a+', newline='') as csv_file:
        dict_writer = DictWriter(csv_file, fieldnames=list(row.keys()))
        if 0 == os.stat(csv_path).st_size:
            dict_writer.writeheader()
        dict_writer.writerow(row)

def generate_random_field_element(p=None):
    """
    Generate a random field element in the range (0,p) where p is the babyjubjub prime as default
    :param p: prime number
    :return: random field element
    """
    if p is None:
        p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
    return secrets.randbelow(p - 1) + 1 


def generate_parameters(output_path):
    """
    Generate the parameters for the encryption scheme and commitment scheme
    :param output_path: path to the output file
    """
    parameters = {'commitment_randomness':generate_random_field_element(),
                  'ciminion_keys':[generate_random_field_element(),generate_random_field_element()],
                  'PINATA_JWT':'Inset the JWT here before upload the proof to IPFS'}
    with open(output_path, 'w') as outfile:
        json.dump(parameters, outfile)

def upload_proof(proof_path, JWT, image_info, lowimage_path, verbose=False):
    """
    Uploads the proof to IPFS and returns the IPFS link
    :param proof_path: path to the proof
    :param JWT: JWT for pinata
    :param image_info: image info dictionary
    :param lowimage_path: path to the low image
    :param verbose: if True prints the IPFS link
    :return: IPFS link
    """
    PINATA_BASE_URL = "https://api.pinata.cloud"
    PINATA_UPLOAD_URL = f"{PINATA_BASE_URL}/pinning/pinFileToIPFS"
    PINATA_WATCH_URL = f"https://gateway.pinata.cloud/ipfs/"

    HEADERS = {"Authorization": f"Bearer {JWT}"}

    image_info_file = f'{image_info["name"]}/image_info.json'
    files = [('file', (image_info_file, json.dumps(image_info), "application/json")),
             ('file', (f'{image_info["name"]}/low_img.png', open(lowimage_path, "rb"), "image/png"))]

    for tile_proof_dir in Path(proof_path).iterdir():
        tile_proof_dir = str(tile_proof_dir)
        tile_number = tile_proof_dir.split('_')[-1]

        proof_file_path = tile_proof_dir + '/proof.json'
        proof_file_name = f'{image_info["name"]}/tile_{tile_number}/proof.json'

        public_file_path = tile_proof_dir + '/public.json'
        public_file_name = f'{image_info["name"]}/tile_{tile_number}/public.json'

        vkey_file_path = tile_proof_dir + '/verification_key.json'
        vkey_file_name = f'{image_info["name"]}/tile_{tile_number}/vkey.json'

        files.extend([ ('file', (proof_file_name, open(proof_file_path, "rb"), "application/json")),
                      ('file', (public_file_name, open(public_file_path, "rb"), "application/json")),
                      ('file', (vkey_file_name, open(vkey_file_path, "rb"), "application/json"))])
        
    response = requests.post(PINATA_UPLOAD_URL, files=files, headers=HEADERS)
    
    if verbose:
        if response.status_code == 200:
            print(f"Uploaded {image_info['name']} to IPFS {PINATA_WATCH_URL}/{response.json()['IpfsHash']}")
            return response.json()['IpfsHash']
        else:
            print(f"Error uploading {image_info['name']} to IPFS")
            print(response.json())
            return  None

    if response.status_code != 200:
        raise ValueError(f"Error uploading {image_info['name']} to IPFS")
    
    return f"{PINATA_WATCH_URL}/{response.json()['IpfsHash']}"
    
def extract_contraints(r1cs_file):
    infos = subprocess.check_output(f'snarkjs r1cs info {r1cs_file}',shell=True).decode('utf-8')
    return int(re.search(r'# of Constraints: (\d+)',infos).group(1))

def verify_proof(proof_path):
    """
    This function verify the proof locally
    :param proof_path: path to the proof file 
    """
    print("Verification process ...")
    main_directory = Path(proof_path)

    image_info_file = main_directory / 'image_info.json'
    if image_info_file.exists():
        with open(image_info_file, 'r') as json_file:
            image_info = json.load(json_file)
    else:
        raise ValueError("The file image_info.json doesn't exist in the proof directory")
    
    low_image_file = main_directory / 'low_image.png'
    if not low_image_file.exists():
        raise ValueError("The file low_image.png doesn't exist in the proof directory")
    low_image = cv2.imread(f'{low_image_file}',cv2.IMREAD_COLOR).flatten()
    print('Image info and low image loaded ...')
    

    dir_list = [x for x in main_directory.iterdir() if x.is_dir()]
    

    with alive_bar(total=len(dir_list), bar = 'smooth',spinner = 'waves2') as bar:
        for i in range(len(dir_list)):
            subdirectory = dir_list[i]
            verify_proof = subprocess.getoutput(f'snarkjs groth16 verify {subdirectory}/vkey.json {subdirectory}/public.json {subdirectory}/proof.json')
            
            with open(f'{subdirectory}/public.json', 'r') as file:
                public = json.load(file)
            tiles_idx = int(subdirectory.name.split('_')[1])
            low_image_offset = 3 + image_info['tiles_size'][tiles_idx][0] * image_info['tiles_size'][tiles_idx][1] * 3
            check_low_image = np.array_equal(np.array(public[low_image_offset:low_image_offset + len(low_image)]).astype(np.uint8),low_image.astype(np.uint8))  

            bar()
            bar.text(f'Tile [{tiles_idx+1}]:{GREEN_TEXT} √{RESET_COLOR}')

            if 'OK!' not in verify_proof or not check_low_image:
                raise ValueError(f'[Tile {subdirectory}] not verified')
    print(f'\nAll tiles verified {GREEN_TEXT}√{RESET_COLOR}\n')

