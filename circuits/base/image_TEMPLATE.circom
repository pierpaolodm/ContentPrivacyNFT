pragma circom 2.0.0;

include "../base/check_hash.circom";
include "../base/check_resize.circom";
include "../base/ciminion/enc_ciminion.circom";
include "../base/el_gamal/enc_elgamal.circom";

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

    signal input public_key[2];
    signal input randomness;
    signal input encoded_master_key0[3];
    signal input encoded_master_key1[3];

    signal output encrypted_image[wTile*hTile*3];
    signal output tag_image;

    //com_master_key[i] = {c1.x,c1.y,c2.x,c2.y,xIncrement}
    signal output comm_master_key0[5];
    signal output comm_master_key1[5];

    //** check equality between master keys and encoded master keys
    master_key0 === encoded_master_key0[0] - encoded_master_key0[2];
    master_key1 === encoded_master_key1[0] - encoded_master_key1[2];

    //** encrypt the image
    component enc = ENC_Ciminion(wTile * hTile * 3);
    enc.master_key0 <== master_key0;
    enc.master_key1 <== master_key1;
    enc.nonce <== nonce;
    enc.IV <== IV;

    for(var i=0; i<wTile; i++)
        for(var j=0; j<hTile; j++)
            for(var k=0; k<3; k++)
                enc.plain_text[i*hTile*3 + j*3 + k] <== full_image[start_height + i][start_width + j][k];

        //get encryption output and tag, since it is an authenticated encryption scheme
    for(var i=0; i<wTile*hTile*3; i++)
        encrypted_image[i] <== enc.cipher_text[i];
    tag_image <== enc.tag;

    //** commitment master key 0
    component comm0 = ElGamalEncrypt();
    for(var i=0; i<3; i++)
        comm0.plaintext[i] <== encoded_master_key0[i];
    
    comm0.pubKey[0] <== public_key[0];
    comm0.pubKey[1] <== public_key[1];
    comm0.randomVal <== randomness;

        //get commitment output, that is an elgamal encryption of the master key
    comm_master_key0[0] <== comm0.c1[0];
    comm_master_key0[1] <== comm0.c1[1];
    comm_master_key0[2] <== comm0.c2[0];
    comm_master_key0[3] <== comm0.c2[1];
    comm_master_key0[4] <== comm0.xIncrement;

    //** commitment master key 1
    component comm1 = ElGamalEncrypt();
    for(var i=0; i<3; i++)
        comm1.plaintext[i] <== encoded_master_key1[i];

    comm1.pubKey[0] <== public_key[0];
    comm1.pubKey[1] <== public_key[1];
    comm1.randomVal <== randomness;

        //get commitment output, that is an elgamal encryption of the master key
    comm_master_key1[0] <== comm1.c1[0];
    comm_master_key1[1] <== comm1.c1[1];
    comm_master_key1[2] <== comm1.c2[0];
    comm_master_key1[3] <== comm1.c2[1];
    comm_master_key1[4] <== comm1.xIncrement;


}
//Image(hFull, wFull, hTile, wTile, hResize, wResize, leaf, num_leaves)
component main{public [low_image,nonce,IV,public_key]} = Image(ThFull, TwFull, ThTile, TwTile, ThResize, TwResize, Tleaf, Tnum_leaves);
