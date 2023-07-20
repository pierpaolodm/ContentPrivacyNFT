pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/escalarmulany.circom";
include "../node_modules/circomlib/circuits/babyjub.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

/*
 * Encrypts a plaintext using ElGamal encryption.
 *
 * plaintext:  An arbitrary value which must be within the BabyJub field and the increment value
 * pubKey:     The public key
 * randomVal:  (A random value y used along with the private key to generate the ciphertext
 *
 */

 template ElGamalEncrypt() {
    
    signal input plaintext[3];
    signal input pubKey[2];
    signal input randomVal;

    signal output c1[2];
    signal output c2[2];
    signal output xIncrement;

    var BASE8[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];

    //const message: Message = encodeToMessage(plaintext)
    component randomValBits = Num2Bits(253);
    randomValBits.in <== randomVal;
    signal randomValBits_array[253];
    for(var i = 0; i < 253; i++){
        randomValBits_array[i] <== randomValBits.out[i];
    }


    //const c1Point = babyJub.mulPointEscalar(babyJub.Base8, randomVal)
    component c1x = EscalarMulAny(253);
    for(var i = 0; i < 253; i++){
        c1x.e[i] <== randomValBits_array[i];
    }
    c1x.p[0] <== BASE8[0];
    c1x.p[1] <== BASE8[1];

    //const pky = babyJub.mulPointEscalar(pubKey, randomVal)
    component pky = EscalarMulAny(253);
    for(var i = 0; i < 253; i++){
        pky.e[i] <== randomValBits_array[i];
    }
    pky.p[0] <== pubKey[0];
    pky.p[1] <== pubKey[1];


    //const c2Point = babyJub.addPoint(
    //    [message.point.x, message.point.y],
    //    pky,
    //)
    component c2x = BabyAdd();
    c2x.x1 <== plaintext[0];
    c2x.y1 <== plaintext[1];

    c2x.x2 <== pky.out[0];
    c2x.y2 <== pky.out[1];


    //return [c1Point, c2Point,xIncrement]
    c1[0] <== c1x.out[0];
    c1[1] <== c1x.out[1];

    c2[0] <== c2x.xout;
    c2[1] <== c2x.yout;

    xIncrement <== plaintext[2];
 }


 //component main{public [pubKey]} = ElGamalEncrypt();
