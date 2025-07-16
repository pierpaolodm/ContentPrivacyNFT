#!/usr/bin/env python3

import argparse
from sha3 import keccak_256 # https://stackoverflow.com/questions/46279121/how-can-i-find-keccak-256-hash-in-python con Crypto.hash
from scripts.babyjubjub_utils.sapling_jubjub import Fq, Point
from .secp256k1 import curve,scalar_mult, is_on_curve
import random

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

def generate_keypair_sec256():
    """
    Generate a BabyJubjub keypair starting from the generator point.
    Arguments are taken from https://eips.ethereum.org/EIPS/eip-2494
    :return: list with the public and private key
    """
    private_key = random.randrange(1, curve.n)
    public_key = scalar_mult(private_key, curve.g)
    # prikey = secp256k1.Fr(0x5f6717883bef25f45a129c11fcac1567d74bda5a9ad4cbffc8203c0da2a1473c)
    # pubkey = secp256k1.G * prikey
    if not is_on_curve(public_key):
        raise ValueError("Public key is not on curve")
    
    return ([public_key[0],public_key[1]], private_key)

def get_DH_key_sec256(private_key, public_key):
    """
    Get the Diffie-Hellman key from a private key and a public key, for the BabyJubjub curve.
    :param private_key: Private key (integer)
    :param public_key: Public key (x,y) tuple of integers
    :return: Diffie-Hellman key (x,y) tuple of integers
    """
    if not is_on_curve(public_key):
        raise ValueError("Public key is not on curve")
    # pubkey = public_key[0], public_key[1]
    DH_key = scalar_mult(private_key, public_key)
    return (DH_key[0], DH_key[1])


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