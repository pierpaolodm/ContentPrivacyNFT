#!/usr/bin/env python3

import argparse
from scripts.util import verify_proof

def main():
    parser = argparse.ArgumentParser(description="proof verifier from IPFS")
    parser.add_argument("--IPFS",type=str,help="link to the IPFS file, where there is the proof")
    args = parser.parse_args()
    verification_resoult = verify_proof(args.IPFS)
    if verification_resoult:
        print("The proof is well formed!")
    else:
        print("Error during verification process ...")

if __name__ == '__main__':
    main()