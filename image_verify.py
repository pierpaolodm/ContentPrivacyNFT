#!/usr/bin/env python3

import argparse
from scripts.util import verify_proof

def main():
    parser = argparse.ArgumentParser(description="proof verifier from IPFS")
    parser.add_argument("--proof-path",type=str,help="path dir, where there is the proof")
    args = parser.parse_args()
    verify_proof(args.proof_path)
    

if __name__ == '__main__':
    main()