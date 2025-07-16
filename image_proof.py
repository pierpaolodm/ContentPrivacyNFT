#!/usr/bin/env python3

import argparse
import json
import os
from scripts.image_ops.image_splitter import max_pixels_per_frame, slice_image
from scripts.image_ops.image_transformation import extract_image_vector, resize_image
from scripts.util import append_to_csv, generate_circuit, generate_input, generate_parameters, measure_command, parse_operation, upload_proof, extract_contraints

CIRCUIT_NAME = 'image'
JSON_INPUT = 'input.json'

def test_circuit(circuit_name, input_path, pot_path, input_array=[],verbose=True):
    r1cs_path = 'output/compiled_circuit/compiled_{}/{}.r1cs'
    print(f'./scripts/compile_circuit.sh ./circuits/benchmark/{circuit_name}.circom {input_path}')
    t_c,m_c = measure_command(f'./scripts/compile_circuit.sh ./circuits/benchmark/{circuit_name}.circom {input_path} ', time=True, memory=False)
    print(f'./scripts/compile_circuit.sh ./circuits/benchmark/{circuit_name}.circom {input_path}')
    if verbose:
        print(f'[{circuit_name}] Compile Circuit: {t_c} seconds, {m_c} KB')
    constraints = extract_contraints(r1cs_path.format(circuit_name,circuit_name))
    if verbose:
        print(f'[{circuit_name}] Constraints: {constraints}')
        
    print(f'./scripts/proving_system/setup_prover.sh {circuit_name} {pot_path}')
    t_sp,m_sp = measure_command(f'./scripts/proving_system/setup_prover.sh {circuit_name} {pot_path}',time=True, memory=False)
    if verbose:
        print(f'[{circuit_name}] Setup Prover: {t_sp} seconds, {m_sp} KB')
    print(f'./scripts/proving_system/prover.sh {circuit_name} ')
    t_p,m_p = measure_command(f'./scripts/proving_system/prover.sh {circuit_name} ', time=True, memory=False)
    if verbose:
        print(f'[{circuit_name}] Prover: {t_p} seconds, {m_p} KB')
    t_v,m_v = measure_command(f'./scripts/proving_system/verifier.sh {circuit_name}', time=True, memory=False)
    if verbose:
        print(f'[{circuit_name}] Verifier: {t_v} seconds, {m_v} KB')
    
    return {'CIRCUIT':circuit_name,
           'INPUT SIZE': input_array[0] * input_array[1],
           'RESIZE SIZE':input_array[2] * input_array[3],
           'CONSTRAINTS': constraints,
           'COMPILE_TIME':t_c,
           'COMPILE_MEMORY':m_c,
           'SETUP_TIME':t_sp,
           'SETUP_MEMORY':m_sp,
           'PROVER_TIME':t_p,
           'PROVER_MEMORY':m_p,
           'VERIFIER_TIME':t_v,
           'VERIFIER_MEMORY':m_v}



if __name__ == '__main__':
    POT = '/home/marco/Documents/Ricerca/privacy-nft/Benchmark_Circuits/powersoftau/28pot.ptau'
    # HFULL, WFULL, HRESIZE, WRESIZE = (160+1),(90+1),(80+1),(45+1) 
    HFULL, WFULL, HRESIZE, WRESIZE = (64),(64),(8),(8) 
    PROOF_PARAMS = './input/params.json'
    generate_parameters(PROOF_PARAMS)

    with open(PROOF_PARAMS, 'r') as file:
        proof_input = json.load(file)

    circuit_name = f'resize_cnft'

    generate_circuit({'HFULL': HFULL, 'WFULL':WFULL, 'HRESIZE':HRESIZE, 'WRESIZE' : WRESIZE }, f'./circuits/base/{circuit_name}.circom',id=HFULL*WFULL)
    input_file = f'./input/input_{HFULL}_{WFULL}.json'

    generate_input(input_file, HFULL, WFULL, HRESIZE, WRESIZE, proof_input['commitment_randomness'],proof_input['ciminion_keys'])
    measures = test_circuit(f'{circuit_name}_{HFULL*WFULL}', input_file, POT, [HFULL, WFULL, HRESIZE, WRESIZE])
    measures['DIM_FULL'] = f'{int(HFULL)}*{int(WFULL)}*3' 
    measures['DIM_RES'] = f'{int(HRESIZE)}*{int(WRESIZE)}*3' 
    append_to_csv(measures,'./benchmark_circuits_resize_final.csv')