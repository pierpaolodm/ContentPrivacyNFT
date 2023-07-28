pragma circom 2.0.0;

include "../base/check_hash.circom";
include "../base/check_resize.circom";
include "../base/ciminion/enc_ciminion.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

template Image(hFull, wFull, hTile, wTile, hResize, wResize, leaf, num_leaves){

    signal input full_image[hFull][wFull][3];
    signal input low_image[hResize][wResize][3];

    signal output tile_hash;

    component resize_checker = Check_Resize(hFull, wFull, hResize, wResize);
    component hash_checker = Check_Hash(hTile, wTile);

    //** Resize Checker **//

    for (var i = 0; i < hFull; i++)
        for (var j = 0; j < wFull; j++) 
            for (var k = 0; k < 3; k++) 
                resize_checker.full_image[i][j][k] <== full_image[i][j][k];


    for (var i = 0; i < hResize; i++)
        for (var j = 0; j < wResize; j++) 
            for (var k = 0; k < 3; k++) 
                resize_checker.resize_image[i][j][k] <== low_image[i][j][k];

    //** Hash Checker **//

    var start_height = hFull >= wFull ? ((leaf == num_leaves - 1) ? (hFull - hTile):(leaf * hTile)) : 0;
    var start_width = wFull > hFull ? ((leaf == num_leaves - 1) ? (wFull - wTile):(leaf * wTile)) : 0;

    for (var i = 0; i < hTile; i++)
        for (var j = 0; j < wTile; j++) 
            for (var k = 0; k < 3; k++) 
                hash_checker.tile_image[i][j][k] <== full_image[start_height + i][start_width + j][k];


    tile_hash <== hash_checker.hash;

    //** Encryption of image and commitment of key**//

    signal input master_key0;
    signal input master_key1;
    signal input nonce;
    signal input IV;
    signal input randomness;

    signal output comm_ciminion_keys;
    signal output tag_image;
    signal output encrypted_image[wTile*hTile*3];


    //** encrypt the image
    component enc = ENC_Ciminion(wTile * hTile * 3);
    enc.master_key0 <== master_key0;
    enc.master_key1 <== master_key1;
    enc.nonce <== nonce;
    enc.IV <== IV;

    for(var i=0; i<hTile; i++)
        for(var j=0; j<wTile; j++)
            for(var k=0; k<3; k++)
                enc.plain_text[i*wTile*3 + j*3 + k] <== full_image[start_height + i][start_width + j][k];

        //get encryption output and tag, since it is an authenticated encryption scheme
    for(var i=0; i<wTile*hTile*3; i++)
        encrypted_image[i] <== enc.cipher_text[i];
    tag_image <== enc.tag;

    //** commitment keys with poseidon
    component keys_commitment = Poseidon(3);
    keys_commitment.inputs[0] <== master_key0;
    keys_commitment.inputs[1] <== master_key1;
    keys_commitment.inputs[2] <== randomness;

    comm_ciminion_keys <== keys_commitment.out;
}
//Image(hFull, wFull, hTile, wTile, hResize, wResize, leaf, num_leaves)
component main{public [low_image,nonce,IV]} = Image(ThFull, TwFull, ThTile, TwTile, ThResize, TwResize, Tleaf, Tnum_leaves);
