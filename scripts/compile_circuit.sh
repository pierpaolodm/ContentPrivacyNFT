#!/bin/bash

# This script is used to execute the circuits in the circuit directory
#check if passed the correct number of arguments, one that is circom file name

if [ $# -lt 2 ]; then
    echo "Usage: $0 <circom file name> <input file name> [--nodejs]"
    echo "[--nodejs] is optional, if not passed, the script will use Cpp to generate the witness"
    exit 1
fi


#define the base path for the circuit library
CIRCOMLIB_PATH=/home/${USER}/node_modules
LOCAL_PATH=$(readlink -f $(dirname $1))

#get the file name without the extension
filename=$(basename -- "$1")
CIRCOM_FILENAME=${filename%.*}




echo "Compiling circuit [${CIRCOM_FILENAME}] ..."

# rm -rf compiled_circuit
mkdir -p compiled_circuit > /dev/null
mkdir -p compiled_circuit/compiled_${CIRCOM_FILENAME} > /dev/null

# Compile the circuits in the circuit directory
#circom ${1} --r1cs --wasm --c --sym --output compiled_circuit/compiled_${CIRCOM_FILENAME} -l ${CIRCOMLIB_PATH} -l ${LOCAL_PATH} --O1

circom ${1} --r1cs --c --output compiled_circuit/compiled_${CIRCOM_FILENAME} -l ${CIRCOMLIB_PATH} -l ${LOCAL_PATH} --O1

if [[ $* == *--nodejs* ]]; then
    echo "Compiling with [NodeJS] ..."
    cd compiled_circuit/compiled_${CIRCOM_FILENAME}/${CIRCOM_FILENAME}_js
    node generate_witness.js ${CIRCOM_FILENAME}.wasm ../../../${2} ../${CIRCOM_FILENAME}_witness.wtns
else
    echo "Compiling with [Cpp] ..."
    cd compiled_circuit/compiled_${CIRCOM_FILENAME}/${CIRCOM_FILENAME}_cpp
    make
    
    ./${CIRCOM_FILENAME} ../../../${2} ../${CIRCOM_FILENAME}_witness.wtns
fi

echo "Witness generated [${CIRCOM_FILENAME}_witness.wtns]"
