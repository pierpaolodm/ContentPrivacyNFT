from csv import DictWriter
import json
import os
import secrets
import subprocess

import numpy as np


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

def generate_input(output_path,full_image,low_image,commitment_key,master_keys):
    """
    Generate the input for the circuit
    :param output_path: path to the output file
    :param full_image: full image to process
    :param low_image: low image to process
    :param commitment_key: commitment key that is a dictionary with the public key and the randomness, for elgamal encryption scheme
    :param master_keys: master keys that is a list with the two master keys, for ciminion authencated encryption scheme
    """
    json_input = {'master_key0':str(master_keys[0]),
                  'master_key1':str(master_keys[1]),
                  'nonce':str(generate_random_field_element()),
                  'IV':str(generate_random_field_element()),
                  'public_key':np.array(commitment_key['public_key']).astype(str).tolist(),
                  'randomness':str(commitment_key['randomness'])}
    
    json_input['encoded_master_key0'] = elgamal_message({'message': master_keys[0], 'randomness': generate_random_field_element()}).split(',')
    json_input['encoded_master_key1'] = elgamal_message({'message': master_keys[1], 'randomness': generate_random_field_element()}).split(',')

    json_input['full_image'] = np.array(full_image).astype(str).tolist()
    json_input['low_image'] = np.array(low_image).astype(str).tolist()
    
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
    Generate a random field element in the range [0,p) where p is the bn128 prime as default
    :param p: prime number
    :return: random field element
    """
    if p is None:
        p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
    return secrets.randbelow(p-1) + 1
    

def elgamal_message(operation_values,encode = True):
    """
    Encode or decode a message using elgamal
    :param operation_values: dictionary with the values to encode or decode the message, if encode is True
                                the dictionary must contain the message and the randomness, otherwise it must
                                contain the x, y and xIncrement values
    :param encode: boolean to indicate if the message must be encoded or decoded
    :return: encoded or decoded message
    """
    if encode:
        operation = f'--encode {operation_values["message"]} {operation_values["randomness"]}'
    else:
        operation = f'--decode {operation_values["x"]} {operation_values["y"]} {operation_values["xIncrement"]}'

    encoded_message = subprocess.getoutput(f'tsc ./scripts/encode_message/elgamal_message.ts && \
                                             node ./scripts/encode_message/elgamal_message.js \
                                             {operation}')
    return encoded_message


