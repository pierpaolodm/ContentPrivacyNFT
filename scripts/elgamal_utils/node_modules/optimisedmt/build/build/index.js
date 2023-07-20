"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined)
        k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function () { return m[k]; } });
}) : (function (o, m, k, k2) {
    if (k2 === undefined)
        k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule)
        return mod;
    var result = {};
    if (mod != null)
        for (var k in mod)
            if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
                __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
exports.__esModule = true;
exports.OptimisedMT = exports.poseidon = exports.hashArray = exports.SNARK_FIELD_SIZE = exports.unstringifyBigInts = exports.stringifyBigInts = exports.hash16 = exports.hash5 = exports.hash4 = exports.hash3 = exports.hash2 = exports.genRandomSalt = void 0;
var assert = require('assert');
var OptimisedMT_1 = require("./OptimisedMT");
exports.OptimisedMT = OptimisedMT_1.OptimisedMT;
var circomlibjs_1 = require("circomlibjs");
exports.poseidon = circomlibjs_1.poseidon;
var crypto = __importStar(require("crypto"));
var ethers = __importStar(require("ethers"));
var ff = require('ffjavascript');
var stringifyBigInts = ff.utils.stringifyBigInts;
exports.stringifyBigInts = stringifyBigInts;
var unstringifyBigInts = ff.utils.unstringifyBigInts;
exports.unstringifyBigInts = unstringifyBigInts;
/*
 * Hash an array of uint256 values the same way that the EVM does.
 */
var hashArray = function (input) {
    var types = [];
    for (var i = 0; i < input.length; i++) {
        types.push('uint256');
    }
    return BigInt(ethers.utils.soliditySha256(types, input.map(function (x) { return x.toString(); }))) % SNARK_FIELD_SIZE;
};
exports.hashArray = hashArray;
// The BN254 group order p
var SNARK_FIELD_SIZE = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
exports.SNARK_FIELD_SIZE = SNARK_FIELD_SIZE;
// Hash up to 2 elements
var poseidonT3 = function (inputs) {
    assert(inputs.length === 2);
    return (0, circomlibjs_1.poseidon)(inputs);
};
// Hash up to 3 elements
var poseidonT4 = function (inputs) {
    assert(inputs.length === 3);
    return (0, circomlibjs_1.poseidon)(inputs);
};
// Hash up to 4 elements
var poseidonT5 = function (inputs) {
    assert(inputs.length === 4);
    return (0, circomlibjs_1.poseidon)(inputs);
};
// Hash up to 5 elements
var poseidonT6 = function (inputs) {
    assert(inputs.length === 5);
    return (0, circomlibjs_1.poseidon)(inputs);
};
// Hash up to 5 elements
var poseidonT17 = function (inputs) {
    assert(inputs.length === 16);
    return (0, circomlibjs_1.poseidon)(inputs);
};
var hashN = function (numElements, elements) {
    var elementLength = elements.length;
    if (elements.length > numElements) {
        throw new TypeError("the length of the elements array should be at most " + numElements + "; got " + elements.length);
    }
    var elementsPadded = elements.slice();
    if (elementLength < numElements) {
        for (var i = elementLength; i < numElements; i++) {
            elementsPadded.push(BigInt(0));
        }
    }
    var funcs = {
        2: poseidonT3,
        3: poseidonT4,
        4: poseidonT5,
        5: poseidonT6,
        16: poseidonT17
    };
    return funcs[numElements](elements);
};
var hash2 = function (elements) { return hashN(2, elements); };
exports.hash2 = hash2;
var hash3 = function (elements) { return hashN(3, elements); };
exports.hash3 = hash3;
var hash4 = function (elements) { return hashN(4, elements); };
exports.hash4 = hash4;
var hash5 = function (elements) { return hashN(5, elements); };
exports.hash5 = hash5;
var hash16 = function (elements) { return hashN(16, elements); };
exports.hash16 = hash16;
/*
 * Returns a BabyJub-compatible random value. We create it by first generating
 * a random value (initially 256 bits large) modulo the snark field size as
 * described in EIP197. This results in a key size of roughly 253 bits and no
 * more than 254 bits. To prevent modulo bias, we then use this efficient
 * algorithm:
 * http://cvsweb.openbsd.org/cgi-bin/cvsweb/~checkout~/src/lib/libc/crypt/arc4random_uniform.c
 * @return A BabyJub-compatible random value.
 */
var genRandomBabyJubValue = function () {
    // Prevent modulo bias
    //const lim = BigInt('0x10000000000000000000000000000000000000000000000000000000000000000')
    //const min = (lim - SNARK_FIELD_SIZE) % SNARK_FIELD_SIZE
    var min = BigInt('6350874878119819312338956282401532410528162663560392320966563075034087161851');
    var rand;
    while (true) {
        rand = BigInt('0x' + crypto.randomBytes(32).toString('hex'));
        if (rand >= min) {
            break;
        }
    }
    var r = rand % SNARK_FIELD_SIZE;
    assert(r < SNARK_FIELD_SIZE);
    return r;
};
/*
 * @return A BabyJub-compatible salt.
 */
var genRandomSalt = function () {
    return genRandomBabyJubValue();
};
exports.genRandomSalt = genRandomSalt;
//# sourceMappingURL=index.js.map