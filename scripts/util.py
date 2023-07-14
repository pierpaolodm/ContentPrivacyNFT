from csv import DictWriter
import os
import secrets
import subprocess


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

def generate_input(output_path,full_image,low_image):
    """
    Generate a json file with the input for the circuit
    :param output_path: path to save the json file
    :param full_image: full image vector
    :param low_image: low image vector
    """
    with open(output_path, 'w') as outfile:
        outfile.write(f'{{"full_image":{full_image.tolist()},"low_image":{low_image.tolist()}}}')

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
    return secrets.randbelow(p)
    