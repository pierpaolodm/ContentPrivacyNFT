"use strict";
exports.__esModule = true;
jest.setTimeout(90000);
var assert = require('assert');
var __1 = require("../");
var OptimisedMT_1 = require("../OptimisedMT");
var IncrementalTree_1 = require("../IncrementalTree");
var ZERO_VALUE = BigInt(0);
describe('Benchmarks', function () {
    var depth = 32;
    var numInsertions = 1000;
    var indexToUpdate = 999;
    var tree = new IncrementalTree_1.IncrementalTree(depth, ZERO_VALUE, 2, __1.hash2);
    var omt = new OptimisedMT_1.OptimisedMT(depth, ZERO_VALUE, 2, __1.hash2);
    it('Insertions', function () {
        var start = Date.now();
        for (var i = 0; i < numInsertions; i++) {
            tree.insert(BigInt(1));
        }
        var end = Date.now();
        var dur = (end - start) / 1000;
        console.log(numInsertions + " insertions took " + dur + " seconds for an IncrementalTree");
        start = Date.now();
        for (var i = 0; i < numInsertions; i++) {
            omt.insert(BigInt(1));
        }
        end = Date.now();
        dur = (end - start) / 1000;
        console.log(numInsertions + " insertions took " + dur + " seconds for an OptimisedMT");
    });
    it('Updates', function () {
        var start = Date.now();
        tree.update(indexToUpdate, BigInt(1234));
        var end = Date.now();
        var dur = (end - start) / 1000;
        console.log("one update took " + dur + " seconds for an IncrementalTree");
        start = Date.now();
        omt.update(indexToUpdate, BigInt(1234));
        end = Date.now();
        dur = (end - start) / 1000;
        console.log("one update took " + dur + " seconds for an OptimisedMT");
    });
});
//# sourceMappingURL=Benchmarks.test.js.map