pragma circom 2.0.0;

include "../base/check_hash.circom";
include "../base/check_resize.circom";

template Image(hFull, wFull, hTile, wTile, hResize, wResize, leaf, num_leaves){

    signal input full_image[hFull][wFull][3];
    signal input low_image[hResize][wResize][3];

    signal output tile_hash;

    component resize_checker = Check_Resize(hFull, wFull, hResize, wResize);
    component hash_checker = Check_Hash(hTile, wTile);

    for (var i = 0; i < hFull; i++)
        for (var j = 0; j < wFull; j++) 
            for (var k = 0; k < 3; k++) 
                resize_checker.full_image[i][j][k] <== full_image[i][j][k];


    for (var i = 0; i < hResize; i++)
        for (var j = 0; j < wResize; j++) 
            for (var k = 0; k < 3; k++) 
                resize_checker.resize_image[i][j][k] <== low_image[i][j][k];



    // Hash Checker

    var start_height = hFull >= wFull ? ((leaf == num_leaves - 1) ? (hFull - hTile):(leaf * hTile)) : 0;
    var start_width = wFull > hFull ? ((leaf == num_leaves - 1) ? (wFull - wTile):(leaf * wTile)) : 0;

    for (var i = 0; i < hTile; i++)
        for (var j = 0; j < wTile; j++) 
            for (var k = 0; k < 3; k++) 
                hash_checker.tile_image[i][j][k] <== full_image[start_height + i][start_width + j][k];




    tile_hash <== hash_checker.hash;
}
//Image(hFull, wFull, hTile, wTile, hResize, wResize, leaf, num_leaves)
component main{public [low_image]} = Image(ThFull, TwFull, ThTile, TwTile, ThResize, TwResize, Tleaf, Tnum_leaves);