pragma circom 2.0.0;
include "./poseidon_sponge.circom";
include "../base/ciminion/enc_ciminion.circom";


template ByteHashEnc(num){
    //Poseidon
    signal input in[num];
    signal output out;

    // Ciminion
    signal input master_key0;
    signal input master_key1;
    signal input nonce;
    signal input IV;
    
    signal output tag_image;
    signal output encrypted_image[num\28];

    component poseidon = SpongeHash(num\28);
    var increase = ((num\28) % 2) == 0;
    var input_size = increase ? num\28 : (num\28) + 1;
    component ciminion = ENC_Ciminion(input_size);

    ciminion.master_key0 <== master_key0;
    ciminion.master_key1 <== master_key1;
    ciminion.nonce <== nonce;
    ciminion.IV <== IV;

    var byte_chuck = 0;
    var hash_counter = 0;

    for(var i = 0; i < num; i++){
        byte_chuck = byte_chuck*(2**8) + in[i];

        if((i+1) % 28 == 0){
            poseidon.in[hash_counter] <== byte_chuck;
            ciminion.plain_text[hash_counter] <== byte_chuck;
            hash_counter++;
            byte_chuck = 0;
        }
    }

    if(!increase)
        ciminion.plain_text[hash_counter] <== 0;

    out <== poseidon.hash;
    // get encryption output and tag, since it is an authenticated encryption scheme
    for(var i=0; i<num\28; i++)
        encrypted_image[i] <== ciminion.cipher_text[i];
    
    tag_image <== ciminion.tag;
}


template ImageHashEnc(height,width){
    // Poseidon
    signal input in[height][width][3];
    signal output hash;

    // Ciminion
    signal input master_key0;
    signal input master_key1;
    signal input nonce;
    signal input IV;
    signal output tag_image;
    signal output encrypted_image[(height*width*3)\28];

    // padding
    var byte_count = height * width * 3;
    var padding = (byte_count % 28) ? 28 - (byte_count % 28) : 0;
    component byte_hash = ByteHashEnc(byte_count + padding);

    byte_hash.master_key0 <== master_key0;
    byte_hash.master_key1 <== master_key1;
    byte_hash.nonce <== nonce;
    byte_hash.IV <== IV;


    for(var i = 0; i < height; i++) {
        for(var j = 0; j < width; j++) {
            for(var k = 0; k < 3; k++) {
                byte_hash.in[(i*width*3) + (j*3) + k] <== in[i][j][k];
            }
        }
    }
   
    for(var i = byte_count; i < byte_count + padding; i++){
        if(i == byte_count)  {
            byte_hash.in[i] <== 7;
        }
        else {
            byte_hash.in[i] <== 0;
        }
    }

    hash <== byte_hash.out;
    //get encryption output and tag, since it is an authenticated encryption scheme
    for(var i=0; i<((byte_count + padding)\28)-1; i++)
        encrypted_image[i] <== byte_hash.encrypted_image[i];
    
    tag_image <== byte_hash.tag_image;
}

//MAIN component main = ImageHash(H,W);
