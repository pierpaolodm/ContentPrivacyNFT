// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./EllipticCurve.sol";

/**
 ** @title Secp256k1 Elliptic Curve
 ** @notice Example of particularization of Elliptic Curve for secp256k1 curve
 ** @author Witnet Foundation
 */
contract Secp256k1 {
    uint256 public constant GX =
        0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798;
    uint256 public constant GY =
        0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8;
    uint256 public constant AA = 0;
    uint256 public constant BB = 7;
    uint256 public constant PP =
        0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;
    
    uint256 constant public HX1 = 10457101036533406547632367118273992217979173478358440826365724437999023779287;
    uint256 constant public HX2 = 2671756056509184035029146175565761955751135805354291559563293617232983272177;
    uint256 constant public HX3 = 5802099305472655231388284418920769829666717045250560929368476121199858275951;

    uint256 constant public HY1 = 19824078218392094440610104313265183977899662750282163392862422243483260492317;
    uint256 constant public HY2 = 2663205510731142763556352975002641716101654201788071096152948830924149045094;
    uint256 constant public HY3 = 5980429700218124965372158798884772646841287887664001482443826541541529227896; 
    /// @notice Public Key derivation from private key
    /// Warning: this is just an example. Do not expose your private key.
    /// @param privKey The private key
    /// @return (qx, qy) The Public Key
    function derivePubKey(
        uint256 privKey
    ) pure external returns (uint256, uint256) {
        return EllipticCurve.ecMul(privKey, GX, GY, AA, PP);
    }

    function pointMul(
        uint256 publicKey0,
        uint256 publicKey1,
        uint256 privKey
    ) pure  external returns (uint256, uint256) {
        return EllipticCurve.ecMul(privKey, publicKey0, publicKey1, AA, PP);
    }

    function isOnCurve (
        uint256 publicKey0,
        uint256 publicKey1
    ) pure external returns (bool) {
        return EllipticCurve.isOnCurve(publicKey0, publicKey1, AA, BB, PP);
    }

}
