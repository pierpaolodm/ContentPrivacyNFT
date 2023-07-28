from csv import DictWriter
import json
import os
from pathlib import Path
import secrets
import subprocess
import cv2
import numpy as np
import requests
from scripts.babyjubjub_utils.sapling_jubjub import Fq, Point



def measure_command(command):
    """
    Execute a command and measure the time and memory used
    :param command: command to execute
    :return: tuple with the time and memory used
    """
    time_command = f'/usr/bin/time -p -f "%e %M" {command} > /dev/null'
    try:
        command_output = subprocess.getoutput(time_command)
        time,mem = command_output.split(' ')
    except:
        raise ValueError(f'[Error while executing] {command}\n[Error message] {command_output}')
    return time,mem

def generate_circuit(info, circuit_template, id = None):
    """
    Generate a circuit from a template
    :param info: dictionary with the information to replace in the template
    :param circuit_template: path to the template
    :param id: id of the circuit

    """
    out_circuit = circuit_template.split('/')[-1].split('_')[0]
    os.makedirs('circuits/tiles',exist_ok=True)

    with open(circuit_template, 'r') as infile:
        circuit = infile.read()
        for k,v in info.items():
            circuit = circuit.replace(k, str(v))
        
        id = f'_{id}' if id is not None else ''
        out_path = f'circuits/tiles/{out_circuit}{id}.circom'
        with open(out_path, 'w') as outfile:
            outfile.write(circuit)
    return out_path

def generate_input(output_path,full_image,low_image,commitment_randomness,master_keys):
    """
    Generate the input for the circuit and save it to a json file
    :param output_path: path to the output file
    :param full_image: full image
    :param low_image: low image
    :param commitment_randomness: randomness used to generate the commitment
    :param master_keys: list with the two master keys for the ciminion authenticated encryption scheme
    """
    json_input = {'master_key0':str(master_keys[0]),
                  'master_key1':str(master_keys[1]),
                  'nonce':str(generate_random_field_element()),
                  'IV':str(generate_random_field_element()),
                  'randomness':str(commitment_randomness),
                  'full_image': np.array(full_image).astype(str).tolist(),
                  'low_image': np.array(low_image).astype(str).tolist()}
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
    

def verify_proof(IPFS_link):
    """
    Verify the proof on IPFS
    :param IPFS_link: IPFS link to the proof
    :return: True if the proof is valid, False otherwise
    """
    image_info_request = requests.get(f'{IPFS_link}/image_info.json')
    if image_info_request.status_code != 200:
        print(f'Error downloading image info from {IPFS_link}')
        return False
    image_info = image_info_request.json()

    raw_low_image_request = requests.get(f'{IPFS_link}/low_img.png')
    if raw_low_image_request.status_code != 200:
        print(f'Error downloading low image from {IPFS_link}')
        return False
    raw_low_image = raw_low_image_request.content
    print('Image info and low image downloaded ...')
    
    min_dims_idx = (image_info['height'],image_info['width']).index(min((image_info['height'],image_info['width'])))
    tile_size = image_info['height'] // (image_info['tiles'] + 1)  if min_dims_idx == 0 else image_info['width'] // (image_info['tiles'] + 1)
    low_image_offset = 3 + tile_size * 3 * (image_info['height'] if min_dims_idx == 0 else image_info['width'])
    # 3 because there is the tag, the hash and the commitment for keys

    low_array = np.frombuffer(raw_low_image, np.uint8)
    low_image = cv2.imdecode(low_array, cv2.IMREAD_COLOR).flatten()
    

    #get the proof for each tile
    for i in range (image_info['tiles'] + 1):
        subprocess.getoutput(f'wget -O /tmp/proof{i}.json {IPFS_link}/tile_{i}/proof.json')
        subprocess.getoutput(f'wget -O /tmp/public{i}.json {IPFS_link}/tile_{i}/public.json')
        subprocess.getoutput(f'wget -O /tmp/vkey{i}.json {IPFS_link}/tile_{i}/vkey.json')
        verify_output = subprocess.getoutput(f'snarkjs groth16 verify /tmp/vkey{i}.json /tmp/public{i}.json /tmp/proof{i}.json')
        
        #open public.json
        with open(f'/tmp/public{i}.json', 'r') as file:
            public = json.load(file)
        
        check_low_image = np.array_equal(np.array(public[low_image_offset:low_image_offset + len(low_image)]).astype(np.uint8),
                                         low_image.astype(np.uint8))
        
        if 'OK!' not in verify_output or not check_low_image:
            print(f'[Tile {i}] not verified')
            return False
        print(f'[Tile {i}] verified')
        subprocess.getoutput(f'rm /tmp/proof{i}.json /tmp/public{i}.json /tmp/vkey{i}.json')
    
    return True
