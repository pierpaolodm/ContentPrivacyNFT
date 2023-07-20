import * as assert from 'assert'
const circom = require('circom')
import { babyJub } from 'circomlib'
import {
    genPrivKey,
    genPubKey,
} from 'maci-crypto'

const F = babyJub.F

interface BabyJubPoint {
    x: BigInt,
    y: BigInt,
}

interface Message {
    point: BabyJubPoint,
    xIncrement: BigInt,
}

interface ElGamalCiphertext {
    c1: BabyJubPoint;
    c2: BabyJubPoint;
    xIncrement: BigInt;
}


const priv_key = genPrivKey()
const pub_key = genPubKey(priv_key)

const output_value = pub_key[0]+","+pub_key[1]+"|"+priv_key
console.log(output_value)