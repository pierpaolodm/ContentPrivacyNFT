#!/usr/bin/env python3

import argparse
from sha3 import keccak_256 # https://stackoverflow.com/questions/46279121/how-can-i-find-keccak-256-hash-in-python con Crypto.hash
from scripts.babyjubjub_utils.sapling_jubjub import Fq, Point
from scripts.util import generate_random_field_element


def get_DH_key(private_key, public_key):
    """
    Get the Diffie-Hellman key from a private key and a public key, for the BabyJubjub curve.
    :param private_key: Private key (integer)
    :param public_key: Public key (x,y) tuple of integers
    :return: Diffie-Hellman key (x,y) tuple of integers
    """
    pubkey = Point(Fq(public_key[0]), Fq(public_key[1]))
    privkey = Fq(private_key)
    DH_key = pubkey * privkey
    return (DH_key.u.s, DH_key.v.s)
    
def generate_keypair():
    """
    Generate a BabyJubjub keypair starting from the generator point.
    Arguments are taken from https://eips.ethereum.org/EIPS/eip-2494
    :return: list with the public and private key
    """
    G = Point(Fq(995203441582195749578291179787384436505546430278305826713579947235728471134), 
              Fq(5472060717959818805561601436314318772137091100104008585924551046643952123905))
    private_key = generate_random_field_element()
    public_key = G * Fq(private_key)
    if not public_key.is_on_curve():
        raise ValueError("Public key is not on curve")
    
    return [[public_key.u.s,public_key.v.s], private_key]


def generate_keys(DH_key,number_of_keys = 3):
    """
    Generate a list of keys from a Diffie-Hellman key, for the BabyJubjub curve.
    :param DH_key: Diffie-Hellman key (x,y) tuple of integers
    :param number_of_keys: Number of keys to generate
    :return: List of keys (integers)
    """
    keys = []
    for i in range(number_of_keys):
        keccak_hash = keccak_256()
        keccak_hash.update(DH_key[0].to_bytes(32, byteorder='big'))
        keccak_hash.update(DH_key[1].to_bytes(32, byteorder='big'))
        keccak_hash.update(i.to_bytes(32, byteorder='big'))
        bytes_key = keccak_hash.digest()
        keys.append(int.from_bytes(bytes_key, byteorder='big'))
    return keys
    

def otp_message(keys, message):
    """
    Encrypt/Decrypt a message with a list of keys, for the BabyJubjub curve.
    :param keys: List of keys (integers)
    :param message: Message to encrypt (integers) or encrypted message (integers)
    :return: Encrypted message (integers) or message (integers)
    """
    otp = []
    for i in range(len(message)):
        otp.append(keys[i] ^ message[i])
    return otp


def main():
    parser = argparse.ArgumentParser(description='Utilities to interact with the Privacy Preserving NFT protocol')
    parser.add_argument("--generate-keypair",
                        action="store_true",
                        help = "generate a keypair (public,private) for babyjubjub curve")
    
    parser.add_argument("--DH-key",
                        nargs=3,
                        type=int,
                        help = "get the Diffie-Hellman shared key on babyjubjub curve, providing private_key public_key.x public_key.y")
    
    args = parser.parse_args()

    if args.generate_keypair:
        keypair = generate_keypair()
        print("Public key: {}".format(keypair[0]))
        print("Private key: {}".format(keypair[1]))

    if args.DH_key:
        DH_key = get_DH_key(args.DH_key[0], (args.DH_key[1], args.DH_key[2]))
        print("Diffie-Hellman key: {}".format(DH_key))
        

if __name__ == "__main__":
   main()
