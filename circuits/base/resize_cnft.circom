pragma circom 2.0.3;

include "./resize.circom";
include "./image_hash.circom";

template Resize_Hash(hFull, wFull, hResize, wResize){

    signal input full_image[hFull][wFull][3];
    signal input resize_image[hResize][wResize][3];

    //** Output signal for the poseidon hash of the image**//
    signal output out;

    //** Additional signal for the encryption of image and commitment of key**//
    signal input master_key0;
    signal input master_key1;
    signal input nonce;
    signal input IV;
    signal input randomness;

    signal output comm_ciminion_keys;
    signal output tag_image;

    var byte_count = hFull * wFull * 3;
    var padding = (byte_count % 28) ? 28 - (byte_count % 28) : 0;
    signal output encrypted_image[(byte_count + padding)\28];


    component resize_checker = Check_Resize(hFull, wFull, hResize, wResize);
    component hash_enc = ImageHashEnc(hFull, wFull);

    //** Resize Checker **//

    for (var i = 0; i < hFull; i++)
        for (var j = 0; j < wFull; j++) 
            for (var k = 0; k < 3; k++) 
                resize_checker.full_image[i][j][k] <== full_image[i][j][k];


    for (var i = 0; i < hResize; i++)
        for (var j = 0; j < wResize; j++) 
            for (var k = 0; k < 3; k++) 
                resize_checker.resize_image[i][j][k] <== resize_image[i][j][k];

    //** Poseidon Hash and Ciminion handler**// 
    
    for (var i = 0; i < hFull; i++) {
        for (var j = 0; j < wFull; j++) {
            for (var k = 0; k < 3; k++) {
                hash_enc.in[i][j][k] <== full_image[i][j][k];
            }
        }
    }       


    //** encrypt the image **//
    hash_enc.master_key0 <== master_key0;
    hash_enc.master_key1 <== master_key1;
    hash_enc.nonce <== nonce;
    hash_enc.IV <== IV;

    //get encryption output and tag, since it is an authenticated encryption scheme
    for(var i=0; i<((byte_count + padding)\28)-1; i++){
        encrypted_image[i] <== hash_enc.encrypted_image[i];
    }
    tag_image <== hash_enc.tag_image;
    out <== hash_enc.hash;

    //** commitment keys with poseidon
    component keys_commitment = Poseidon(3);
    keys_commitment.inputs[0] <== master_key0;
    keys_commitment.inputs[1] <== master_key1;
    keys_commitment.inputs[2] <== randomness;

    comm_ciminion_keys <== keys_commitment.out;
}

//MAIN component main = Resize_Hash(HFULL,WFULL,HRESIZE,WRESIZE);
