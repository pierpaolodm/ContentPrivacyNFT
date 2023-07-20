"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var circom = require('circom');
var circomlib_1 = require("circomlib");
var maci_crypto_1 = require("maci-crypto");
var F = circomlib_1.babyJub.F;
/*
* Converts a BigInt into a Message.
* The Message is a BabyJub point and an x-increment.
* The x-increment is the difference between the x-value of the
* BabyJub point and the original value.
* @param original The original value to convert.
* @param randomVal The random value to use for the ElGamal encryption.
*/
var encodeToMessage = function (original, randomVal) {
    if (randomVal === void 0) { randomVal = (0, maci_crypto_1.genRandomSalt)(); }
    var randomPoint = (0, maci_crypto_1.genPubKey)(randomVal);
    assert(circomlib_1.babyJub.inSubgroup(randomPoint));
    var xIncrement = F.e(F.sub(randomPoint[0], original));
    assert(xIncrement >= BigInt(0));
    var xVal = randomPoint[0];
    var yVal = randomPoint[1];
    var point = { x: xVal, y: yVal };
    return { point: point, xIncrement: xIncrement };
};
/*
* Converts a Message into the original value.
* The original value is the x-value of the BabyJub point minus the
* x-increment.
* @param message The message to convert.
*/
var decodeMessage = function (message) {
    var decoded = BigInt(F.e(F.sub(message.point.x, message.xIncrement)));
    assert(decoded >= BigInt(0));
    assert(decoded < circomlib_1.babyJub.p);
    return decoded;
};
/**
 *
 * START OF SCRIPT
 *
 */
var input_command = process.argv[2];
if (input_command !== "--encode" && input_command !== "--decode") {
    console.log("Invalid input command");
    process.exit(1);
}
if (input_command === "--encode") {
    var message = BigInt(process.argv[3]);
    var randomness = BigInt(process.argv[4]);
    var encodedMessage = encodeToMessage(message, randomness);
    var output_message = "".concat(encodedMessage.point.x, ",") + "".concat(encodedMessage.point.y, ",") + "".concat(encodedMessage.xIncrement);
    console.log(output_message);
}
if (input_command === "--decode") {
    var x = BigInt(process.argv[3]);
    var y = BigInt(process.argv[4]);
    var xIncrement = BigInt(process.argv[5]);
    var message = { point: { x: x, y: y }, xIncrement: xIncrement };
    var decodedMessage = decodeMessage(message);
    console.log(decodedMessage.toString());
}
