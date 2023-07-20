pragma circom 2.0.0;

include "./ciminion_base/ciminion_enc.circom";

template ENC_Ciminion(input_size) {
    signal input master_key0;
    signal input master_key1;
    signal input nonce;
    signal input IV;

    signal input plain_text[input_size];
    signal output cipher_text[input_size];
    signal output tag;

    assert(input_size % 2 == 0);
    var nPairs = input_size \ 2;
    component ciminion_enc = CiminionEnc(nPairs); 

    ciminion_enc.MK_0 <== master_key0;
    ciminion_enc.MK_1 <== master_key1;
    ciminion_enc.nonce <== nonce;
    ciminion_enc.IV <== IV;

    for (var i = 0; i < input_size; i++)
        ciminion_enc.PT[i] <== plain_text[i];
    
    //GETTING OUTPTUTS

    tag <== ciminion_enc.TAG;
    for (var i = 0; i < input_size; i++)
        cipher_text[i] <== ciminion_enc.CT[i];


}

