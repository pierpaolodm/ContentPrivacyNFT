pragma circom 2.0.0;

include "./ciminion_base/ciminion_dec.circom";
include "./ciminion_base/ciminion_mac.circom";

template DEC_Ciminion(input_size) {
    signal input master_key0;
    signal input master_key1;
    signal input nonce;
    signal input IV;

    signal input cipher_text[input_size];
    signal input tag;

    signal output plain_text[input_size];

    assert(input_size % 2 == 0);
    var nPairs = input_size \ 2;

    component ciminion_dec = CiminionDec(nPairs); 
    component ciminion_mac = CiminionMac(nPairs);

    // INPUT ASSIGNMENT 
    ciminion_dec.MK_0 <== master_key0;
    ciminion_mac.MK_0 <== master_key0;

    ciminion_dec.MK_1 <== master_key1;
    ciminion_mac.MK_1 <== master_key1;

    ciminion_dec.nonce <== nonce;
    ciminion_mac.nonce <== nonce;

    ciminion_dec.IV <== IV;
    ciminion_mac.IV <== IV;

    for(var i = 0; i<input_size; i++){
        ciminion_dec.CT[i] <== cipher_text[i];
        ciminion_mac.CT[i] <== cipher_text[i];
    }

    // CHECK TAG
    ciminion_mac.TAG === tag;

    //GET PLAIN TEXT
    for(var i = 0;i<input_size; i++)
        plain_text[i] <== ciminion_dec.PT[i];

}

