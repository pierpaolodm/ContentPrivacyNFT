#!/usr/bin/env python3

import argparse
import json
import os
from scripts.image_ops.image_splitter import max_pixels_per_frame, slice_image
from scripts.image_ops.image_transformation import extract_image_vector, resize_image
from scripts.util import append_to_csv, generate_circuit, generate_input, generate_parameters, measure_command, parse_operation, upload_proof

# Modify this to change the powers of tau file
POT = f'25.pot'


CIRCUIT_NAME = 'image'
JSON_INPUT = 'input.json'


def generate_proof(image_path, frame_pixel, operation, operation_info, proof_parameters, save_tiles=None, save_image=None ,generate_csv=False, generate_contract=False):
    """
    Generate proof for image transformation and print the time and memory usage of each image frame
    :param image_path: path to image
    :param frame_pixel: number of pixels to divide in the gratest dimension of the frame
    :param operation: image operation to perform e.g. resize
    :param operation_info: information about the operation e.g. height, width
    :param save_tiles: path to save frames
    :param save_image: path to save low-res image
    """
    
    full_image = extract_image_vector(image_path)
    Fheight,Fwidth = full_image.shape[:2]

    if operation == 'resize':
        height, width = operation_info['height'], operation_info['width']  
        _,low_image = resize_image(image_path, height,width, output_path=save_image)
    else:
        raise NotImplementedError('Operation not implemented yet.')
    Lheight,Lwidth = low_image.shape[:2]

    """
    if operation == 'crop':
        height, width,x,y = operation_info['height'], operation_info['width'], \
                            operation_info['x'],operation_info['y']
        _,low_image = crop_image(image_path, height,width,x,y, output_path=save_image)
    """

    with open(proof_parameters, 'r') as file:
        proof_input = json.load(file)

    generate_input(f'input/{JSON_INPUT}', full_image, low_image,
                   {'public_key':proof_input['elgamal_public_key'],'randomness':proof_input['elgamal_randomness']},proof_input['ciminion_keys'])

    frame_list = slice_image(image_path, frame_pixel, save_tiles=save_tiles, dimension=None)
    for i,frame in enumerate(frame_list):
        Theight,Twidth = frame.shape[:2]
        output_circuit = generate_circuit({ 'ThFull':Fheight,'TwFull':Fwidth,'ThTile':Theight,'TwTile':
                                            Twidth,'ThResize':Lheight,'TwResize':Lwidth,
                                            'Tleaf':i,'Tnum_leaves':len(frame_list)},
                                            f'circuits/base/{CIRCUIT_NAME}_TEMPLATE.circom', id=i)

        tc, mc = measure_command(f'./scripts/compile_circuit.sh {output_circuit} input/{JSON_INPUT}')
        tsp, msp = measure_command(f'./scripts/proving_system/setup_prover.sh {CIRCUIT_NAME}_{i} {f"./powersoftau/{POT}"}')
        tp, mp = measure_command(f'./scripts/proving_system/prover.sh {CIRCUIT_NAME}_{i}')
        tv, mv = measure_command(f'./scripts/proving_system/verifier.sh {CIRCUIT_NAME}_{i} {f"--generate-contract {i}" if generate_contract else ""}')

        if generate_csv:
            csv_path = f'./output/{CIRCUIT_NAME}_stats.csv'
            row = {'frame':i,'time_circuit':tc,'memory_circuit':mc,'time_setup':tsp,'memory_setup':msp,
                   'time_prover':tp,'memory_prover':mp,'time_verifier':tv,'memory_verifier':mv}
            append_to_csv(row,csv_path)



###############################################################
##              MAIN FOR PARSING ARGUMENTS                   ##
###############################################################
#./image_proof.py --image ./input/penguin.png --operation resize_22x22 --frame-pixel 32 --save-tiles ./output/tiles --save-image ./output/penguin_32.png --generate-csv --generate-contract

def main():
    parser = argparse.ArgumentParser(description='Generate image proof')
    parser.add_argument('--image',
                        help='image to generate proof for') 

    parser.add_argument('--frame-pixel',
                        help='number of pixels to divide in the gratest dimension of the frame',
                        type=int)
    
    parser.add_argument('--check-pixel',
                        help='maximun number of pixels to divide and the dimension e.g. 128 stands for 128x128x3',
                        type=int)

    parser.add_argument('--save-tiles',
                        help='path to save frames',
                        default=None)
    
    parser.add_argument('--operation',
                        help='image operation to perform e.g. resize_10x10',
                        default='resize_10x10')
    
    parser.add_argument('--save-image',
                        help='path to save low-res image',
                        default=None)
    
    parser.add_argument('--generate-csv',
                        help='generate csv file with time and memory usage',
                        action='store_true')
    
    parser.add_argument('--generate-contract',
                        help='generate contract in solidity for verifiy the proof on ethereum',
                        action='store_true')
    
    parser.add_argument('--proof-parameters',
                        help='path to proof parameters',
                        default=None)
    
    exclusive_group = parser.add_mutually_exclusive_group()
    exclusive_group.add_argument('--generate-parameters',
                             help='file path name in which parameters for the encryption scheme and commitment scheme will be generated, used also to the proof',
                             nargs='?', 
                             const='./input/parameters.json')  

    args = parser.parse_args()

    if args.generate_parameters:
        if len(vars(args)) > 1:
            parser.error('--generate-parameters must be used alone and cannot be combined with other options')
        else:
            generate_parameters(args.generate_parameters)
            return


    if not args.image or not os.path.exists(args.image) or not args.image.endswith('.png'):
        parser.error('image not found')

    if (not(args.frame_pixel or args.check_pixel)) or (args.frame_pixel and args.check_pixel):
        parser.error('frame_pixel or check_pixel are requiredm but not both')
#!/usr/bin/env python3

import argparse
import json
import os
from scripts.image_ops.image_splitter import max_pixels_per_frame, slice_image
from scripts.image_ops.image_transformation import extract_image_vector, resize_image
from scripts.util import append_to_csv, generate_circuit, generate_input, generate_parameters, measure_command, parse_operation

# Modify this to change the powers of tau file
POT = f'25.pot'


CIRCUIT_NAME = 'image'
JSON_INPUT = 'input.json'


def generate_proof(image_path, frame_pixel, operation, operation_info, proof_parameters, save_tiles=None, save_image=None ,generate_csv=False, generate_contract=False, to_IPFS=False):
    """
    Generate proof for image transformation and print the time and memory usage of each image frame
    :param image_path: path to image
    :param frame_pixel: number of pixels to divide in the gratest dimension of the frame
    :param operation: image operation to perform e.g. resize
    :param operation_info: information about the operation e.g. height, width
    :param save_tiles: path to save frames
    :param save_image: path to save low-res image
    """
    
    full_image = extract_image_vector(image_path)
    Fheight,Fwidth = full_image.shape[:2]

    if operation == 'resize':
        height, width = operation_info['height'], operation_info['width']  
        _,low_image = resize_image(image_path, height,width, output_path=save_image)
    else:
        raise NotImplementedError('Operation not implemented yet.')
    Lheight,Lwidth = low_image.shape[:2]

    """
    if operation == 'crop':
        height, width,x,y = operation_info['height'], operation_info['width'], \
                            operation_info['x'],operation_info['y']
        _,low_image = crop_image(image_path, height,width,x,y, output_path=save_image)
    """

    with open(proof_parameters, 'r') as file:
        proof_input = json.load(file)

    if to_IPFS and proof_input['PINATA_JWT'] == 'Insert the JWT here before upload the proof to IPFS':
        raise ValueError('Insert the JWT in the proof parameters before upload the proof to IPFS')


    generate_input(f'input/{JSON_INPUT}', full_image, low_image,
                   {'public_key':proof_input['elgamal_public_key'],'randomness':proof_input['elgamal_randomness']},proof_input['ciminion_keys'])

    frame_list = slice_image(image_path, frame_pixel, save_tiles=save_tiles, dimension=None)
    for i,frame in enumerate(frame_list):
        Theight,Twidth = frame.shape[:2]
        
        output_circuit = generate_circuit({ 'ThFull':Fheight,'TwFull':Fwidth,'ThTile':Theight,'TwTile':
                                            Twidth,'ThResize':Lheight,'TwResize':Lwidth,
                                            'Tleaf':i,'Tnum_leaves':len(frame_list)},
                                            f'circuits/base/{CIRCUIT_NAME}_TEMPLATE.circom', id=i)

        tc, mc = measure_command(f'./scripts/compile_circuit.sh {output_circuit} input/{JSON_INPUT}')
        tsp, msp = measure_command(f'./scripts/proving_system/setup_prover.sh {CIRCUIT_NAME}_{i} {f"./powersoftau/{POT}"}')
        tp, mp = measure_command(f'./scripts/proving_system/prover.sh {CIRCUIT_NAME}_{i}')
        tv, mv = measure_command(f'./scripts/proving_system/verifier.sh {CIRCUIT_NAME}_{i} {f"--generate-contract {i}" if generate_contract else ""}')

        if generate_csv:
            csv_path = f'./output/{CIRCUIT_NAME}_stats.csv'
            row = {'frame':i,'time_circuit':tc,'memory_circuit':mc,'time_setup':tsp,'memory_setup':msp,
                   'time_prover':tp,'memory_prover':mp,'time_verifier':tv,'memory_verifier':mv}
            append_to_csv(row,csv_path)
        
    if to_IPFS:
        upload_proof(f'./output/snarkjs_circuit/',proof_input['PINATA_JWT'] ,
                     {'name':os.path.basename(image_path).split('.')[0],'height':Fheight,'width':Fwidth,'tiles':i},save_image)



###############################################################
##              MAIN FOR PARSING ARGUMENTS                   ##
###############################################################
#./image_proof.py --image ./input/ramen.png --operation resize_22x22 --frame-pixel 8 --save-tiles ./output/tiles --save-image ./output/ramen_22.png --generate-csv --to_IPFS --proof-parameters ./input/parameters.json 
def main():
    parser = argparse.ArgumentParser(description='Generate image proof')
    parser.add_argument('--image',
                        help='image to generate proof for') 

    parser.add_argument('--frame-pixel',
                        help='number of pixels to divide in the gratest dimension of the frame',
                        type=int)
    
    parser.add_argument('--check-pixel',
                        help='maximun number of pixels to divide and the dimension e.g. 128 stands for 128x128x3',
                        type=int)

    parser.add_argument('--save-tiles',
                        help='path to save frames',
                        default=None)
    
    parser.add_argument('--operation',
                        help='image operation to perform e.g. resize_10x10',
                        default='resize_10x10')
    
    parser.add_argument('--save-image',
                        help='path to save low-res image',
                        default=None)
    
    parser.add_argument('--generate-csv',
                        help='generate csv file with time and memory usage',
                        action='store_true')
    
    parser.add_argument('--generate-contract',
                        help='generate contract in solidity for verifiy the proof on ethereum',
                        action='store_true')
    
    parser.add_argument('--proof-parameters',
                        help='path to proof parameters',
                        default=None)
    
    parser.add_argument('--to_IPFS',
                        help='upload the proof to IPFS',
                        action='store_true')
    
    exclusive_group = parser.add_mutually_exclusive_group()
    exclusive_group.add_argument('--generate-parameters',
                             help='file path name in which parameters for the encryption scheme and commitment scheme will be generated, used also to the proof, it also could be insert the pinata JWT to upload the proof to IPFS',
                             nargs='?', 
                             const='./input/parameters.json')  

    args = parser.parse_args()

    if args.generate_parameters:
        if not args.generate_parameters.endswith('.json'):
            parser.error('generate_parameters must be a json file')

        generate_parameters(args.generate_parameters)
        return


    if not args.image or not os.path.exists(args.image) or not args.image.endswith('.png'):
        parser.error('image not found')

    if (not(args.frame_pixel or args.check_pixel)) or (args.frame_pixel and args.check_pixel):
        parser.error('frame_pixel or check_pixel are requiredm but not both')

    if args.save_image and not os.path.exists(os.path.dirname(args.save_image)):
        parser.error('save_image path not found')

    if args.save_image and not args.save_image.endswith('.png'):
        parser.error('save_image must be a png file')

    if args.save_image is None:
        args.save_image = os.path.join(os.path.dirname(args.image), f'{args.operation}_{os.path.basename(args.image)}')

    if args.check_pixel:
        dimension,max_pixels = max_pixels_per_frame(args.image, args.check_pixel**2*3)
        print(f'Max pixels per frame are {max_pixels} to divide the {["height", "width"][dimension]} in order to have a computation that respects the threshold of {args.check_pixel}')
        return

    if args.frame_pixel:
        operation,operation_info = parse_operation(args.operation)
        generate_proof(args.image, args.frame_pixel,operation, operation_info, args.proof_parameters, args.save_tiles, args.save_image, args.generate_csv, args.generate_contract,args.to_IPFS)





if __name__ == '__main__':
    main()
    """
    ./image_proof.py  --image ./input/ramen.png --operation resize_22x22 --frame-pixel 16  --save-tiles ./output/tiles --save-image ./output/ramen_12.png --generate-csv --proof-parameters ./input/parameters.json
    """