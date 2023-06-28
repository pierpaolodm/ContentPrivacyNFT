pragma circom 2.0.0;

include "./poseidon2/poseidon2_hash.circom";


template Check_Hash(hTile, wTile){
    signal input  tile_image[hTile][wTile][3];
    signal output hash;

    component poseidon2_hash  = Poseidon2_hash(hTile * wTile * 3);

    var hash_counter = 0;

    for(var i = 0; i < hTile; i++){
        for(var j = 0; j < wTile; j++){
            for(var k = 0; k < 3; k++){
                poseidon2_hash.inp[hash_counter]  <== tile_image[i][j][k];
                hash_counter = hash_counter + 1;
            }
        }
    }

    hash <== poseidon2_hash.out;
    
}
