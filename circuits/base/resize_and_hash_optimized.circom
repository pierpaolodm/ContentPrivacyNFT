pragma circom 2.0.3;

include "./resize.circom";
include "./image_hash.circom";
include "../base/ciminion/enc_ciminion.circom";
// include "../node_modules/circomlib/circuits/poseidon.circom";

template Resize_Hash(hFull, wFull, hResize, wResize){

    signal input full_image[hFull][wFull][3];
    signal input resize_image[hResize][wResize][3];

    signal output out;

    component resize_checker = Check_Resize(hFull, wFull, hResize, wResize);
    component hash = ImageHash(hFull, wFull);

    //** Resize Checker **//

    for (var i = 0; i < hFull; i++)
        for (var j = 0; j < wFull; j++) 
            for (var k = 0; k < 3; k++) 
                resize_checker.full_image[i][j][k] <== full_image[i][j][k];


    for (var i = 0; i < hResize; i++)
        for (var j = 0; j < wResize; j++) 
            for (var k = 0; k < 3; k++) 
                resize_checker.resize_image[i][j][k] <== resize_image[i][j][k];

    //** Poseidon Hash **// 
    
    for (var i = 0; i < hFull; i++) {
        for (var j = 0; j < wFull; j++) {
            for (var k = 0; k < 3; k++) {
                hash.in[i][j][k] <== full_image[i][j][k];
            }
        }
    }       

    out <== hash.hash;

    //** Encryption of image and commitment of key**//

    signal input master_key0;
    signal input master_key1;
    signal input nonce;
    signal input IV;
    signal input randomness;

    signal output comm_ciminion_keys;
    signal output tag_image;
    signal output encrypted_image[wFull*hFull*3];

    //** encrypt the image - TODO ottimizzazione tipo quello dell'hash
    component enc = ENC_Ciminion(wFull * hFull * 3);
    enc.master_key0 <== master_key0;
    enc.master_key1 <== master_key1;
    enc.nonce <== nonce;
    enc.IV <== IV;

    for(var i=0; i<hFull; i++)
        for(var j=0; j<wFull; j++)
            for(var k=0; k<3; k++)
                enc.plain_text[i*wFull*3 + j*3 + k] <== full_image[i][j][k];

        //get encryption output and tag, since it is an authenticated encryption scheme
    for(var i=0; i<wFull*hFull*3; i++)
        encrypted_image[i] <== enc.cipher_text[i];
    tag_image <== enc.tag;

    //** commitment keys with poseidon
    component keys_commitment = Poseidon(3);
    keys_commitment.inputs[0] <== master_key0;
    keys_commitment.inputs[1] <== master_key1;
    keys_commitment.inputs[2] <== randomness;

    comm_ciminion_keys <== keys_commitment.out;
}
//MAIN component main = Resize_Hash(HFULL,WFULL,HRESIZE,WRESIZE);
