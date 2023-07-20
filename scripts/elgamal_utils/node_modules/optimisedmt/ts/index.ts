const assert = require('assert')
import { OptimisedMT } from './OptimisedMT'
import { babyJub, poseidon, eddsa } from 'circomlibjs'
import * as crypto from 'crypto'
import * as ethers from 'ethers'
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts
const unstringifyBigInts: (obj: object) => any = ff.utils.unstringifyBigInts

/*
 * Hash an array of uint256 values the same way that the EVM does.
 */
const hashArray = (input: bigint[]): bigint => {
    const types: string[] = []
    for (let i = 0; i < input.length; i ++) {
        types.push('uint256')
    }
    return BigInt(
        ethers.utils.soliditySha256(
            types,
            input.map((x) => x.toString()),
        ),
    ) % SNARK_FIELD_SIZE
}

type Plaintext = BigInt[]
// The BN254 group order p
const SNARK_FIELD_SIZE = BigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617'
)

// Hash up to 2 elements
const poseidonT3 = (inputs: bigint[]) => {
    assert(inputs.length === 2)
    return poseidon(inputs)
}

// Hash up to 3 elements
const poseidonT4 = (inputs: bigint[]) => {
    assert(inputs.length === 3)
    return poseidon(inputs)
}

// Hash up to 4 elements
const poseidonT5 = (inputs: bigint[]) => {
    assert(inputs.length === 4)
    return poseidon(inputs)
}

// Hash up to 5 elements
const poseidonT6 = (inputs: bigint[]) => {
    assert(inputs.length === 5)
    return poseidon(inputs)
}

// Hash up to 5 elements
const poseidonT17 = (inputs: bigint[]) => {
    assert(inputs.length === 16)
    return poseidon(inputs)
}

const hashN = (numElements: number, elements: Plaintext): bigint => {
    const elementLength = elements.length
    if (elements.length > numElements) {
        throw new TypeError(`the length of the elements array should be at most ${numElements}; got ${elements.length}`)
    }
    const elementsPadded = elements.slice()
    if (elementLength < numElements) {
        for (let i = elementLength; i < numElements; i++) {
            elementsPadded.push(BigInt(0))
        }
    }

    const funcs = {
        2: poseidonT3,
        3: poseidonT4,
        4: poseidonT5,
        5: poseidonT6,
        16: poseidonT17,
    }

    return funcs[numElements](elements)
}

const hash2 = (elements: Plaintext): bigint => hashN(2, elements)
const hash3 = (elements: Plaintext): bigint => hashN(3, elements)
const hash4 = (elements: Plaintext): bigint => hashN(4, elements)
const hash5 = (elements: Plaintext): bigint => hashN(5, elements)
const hash16 = (elements: Plaintext): bigint => hashN(16, elements)

/*
 * Returns a BabyJub-compatible random value. We create it by first generating
 * a random value (initially 256 bits large) modulo the snark field size as
 * described in EIP197. This results in a key size of roughly 253 bits and no
 * more than 254 bits. To prevent modulo bias, we then use this efficient
 * algorithm:
 * http://cvsweb.openbsd.org/cgi-bin/cvsweb/~checkout~/src/lib/libc/crypt/arc4random_uniform.c
 * @return A BabyJub-compatible random value.
 */
const genRandomBabyJubValue = (): bigint => {

    // Prevent modulo bias
    //const lim = BigInt('0x10000000000000000000000000000000000000000000000000000000000000000')
    //const min = (lim - SNARK_FIELD_SIZE) % SNARK_FIELD_SIZE
    const min = BigInt('6350874878119819312338956282401532410528162663560392320966563075034087161851')

    let rand
    while (true) {
        rand = BigInt('0x' + crypto.randomBytes(32).toString('hex'))

        if (rand >= min) {
            break
        }
    }

    const r: bigint = rand % SNARK_FIELD_SIZE
    assert(r < SNARK_FIELD_SIZE)

    return r
}

/*
 * @return A BabyJub-compatible salt.
 */
const genRandomSalt = (): bigint => {

    return genRandomBabyJubValue()
}

export {
    genRandomSalt,
    hash2,
    hash3,
    hash4,
    hash5,
    hash16,
    stringifyBigInts,
    unstringifyBigInts,
    SNARK_FIELD_SIZE,
    hashArray,
    poseidon,
    OptimisedMT,
}
