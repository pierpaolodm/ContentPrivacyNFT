"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
jest.setTimeout(90000);
var assert = require('assert');
var __1 = require("../");
var OptimisedMT_1 = require("../OptimisedMT");
var ff = require('ffjavascript');
var stringifyBigInts = ff.utils.stringifyBigInts;
var ZERO_VALUE = BigInt(0);
var hashLeftRight = function (left, right) {
    return (0, __1.hash2)([left, right]);
};
var testEmpty = function (depth, arity, hashFunc) {
    var tree = new OptimisedMT_1.OptimisedMT(depth, ZERO_VALUE, arity, hashFunc);
    var leaves = [];
    for (var i = 0; i < Math.pow(arity, depth); i++) {
        leaves.push(ZERO_VALUE);
    }
    var expectedRoot = (0, OptimisedMT_1.calculateRoot)(leaves, arity, hashFunc);
    expect(tree.root.toString()).toEqual(expectedRoot.toString());
};
var testCalcParentIndices = function (_index, _leavesPerNode, _depth, _expected) {
    var indices = OptimisedMT_1.OptimisedMT.calcParentIndices(_index, _leavesPerNode, _depth);
    expect(indices.toString()).toEqual(_expected.toString());
};
var testCalcChildIndices = function (_index, _leavesPerNode, _depth, _expected) {
    var indices = OptimisedMT_1.OptimisedMT.calcChildIndices(_index, _leavesPerNode, _depth);
    expect(indices.toString()).toEqual(_expected.toString());
};
var testInsertion = function (depth, arity, hashFunc) {
    var tree = new OptimisedMT_1.OptimisedMT(depth, ZERO_VALUE, arity, hashFunc);
    var leaves = [];
    for (var i = 0; i < Math.pow(arity, depth); i++) {
        var rootBefore = tree.root;
        var nextIndexBefore = tree.nextIndex;
        var leaf = BigInt(i + 1);
        leaves.push(leaf);
        tree.insert(leaf);
        var nextIndexAfter = tree.nextIndex;
        var rootAfter = tree.root;
        expect(nextIndexBefore + 1).toEqual(nextIndexAfter);
        expect(rootBefore).not.toEqual(rootAfter);
    }
    var expectedRoot = (0, OptimisedMT_1.calculateRoot)(leaves, arity, hashFunc);
    expect(tree.root.toString()).toEqual(expectedRoot.toString());
    //const miTree = new MultiIncrementalTree(depth, ZERO_VALUE, arity, hashFunc)
    //const iTree = new IncrementalTree(depth, ZERO_VALUE, arity, hashFunc)
    //const leaves: bigint[] = []
    //for (let i = 0; i < arity ** depth; i ++) {
    //const leaf = BigInt(i)
    //leaves.push(leaf)
    //miTree.insert(leaf)
    //iTree.insert(leaf)
    //expect(miTree.roots[0].toString()).toEqual(iTree.root.toString())
    //}
    //const expectedRoot = calculateRoot(leaves, arity, hashFunc)
    //expect(miTree.roots[0].toString()).toEqual(expectedRoot.toString())
    //expect(iTree.root.toString()).toEqual(expectedRoot.toString())
    //const newLeaf = BigInt(1234)
    //miTree.insert(newLeaf)
    //const newLeaves: bigint[] = [newLeaf]
    //for (let i = 1; i < arity ** depth; i ++) {
    //const leaf = BigInt(i)
    //newLeaves.push(leaf)
    //miTree.insert(leaf)
    //}
    //const newExpectedRoot = calculateRoot(newLeaves, arity, hashFunc)
    //expect(miTree.roots[1].toString()).toEqual(newExpectedRoot.toString())
};
var testUpdate = function (depth, arity, hashFunc) {
    var tree = new OptimisedMT_1.OptimisedMT(depth, ZERO_VALUE, arity, hashFunc);
    var leaves = [];
    for (var i = 0; i < Math.pow(arity, depth); i++) {
        var leaf = BigInt(i);
        leaves.push(leaf);
        tree.insert(leaf);
    }
    var newLeaf = BigInt(1234);
    var indexToUpdate = Math.pow(arity, depth) - 1;
    var rootBefore = tree.root;
    var nextIndexBefore = tree.nextIndex;
    leaves[indexToUpdate] = newLeaf;
    tree.update(indexToUpdate, newLeaf);
    var nextIndexAfter = tree.nextIndex;
    var rootAfter = tree.root;
    expect(rootBefore).not.toEqual(rootAfter);
    var expectedRoot = (0, OptimisedMT_1.calculateRoot)(leaves, arity, hashFunc);
    expect(tree.root.toString()).toEqual(expectedRoot.toString());
    expect(nextIndexBefore).toEqual(nextIndexAfter);
    //const miTree = new MultiIncrementalTree(depth, ZERO_VALUE, arity, hashFunc)
    //const iTree = new IncrementalTree(depth, ZERO_VALUE, arity, hashFunc)
    //const leaves: bigint[] = []
    //for (let i = 0; i < arity ** depth; i ++) {
    //const leaf = BigInt(i)
    //leaves.push(leaf)
    //miTree.insert(leaf)
    //iTree.insert(leaf)
    //}
    //const newLeaf = BigInt(1234)
    //const indexToUpdate = arity ** depth - 1 
    //leaves[indexToUpdate] = newLeaf
    //miTree.update(indexToUpdate, newLeaf)
    //iTree.update(indexToUpdate, newLeaf)
    //const expectedRoot = calculateRoot(leaves, arity, hashFunc)
    //expect(iTree.root.toString()).toEqual(expectedRoot.toString())
    //expect(miTree.roots[0].toString()).toEqual(expectedRoot.toString())
    //const newMiTree = new MultiIncrementalTree(depth, ZERO_VALUE, arity, hashFunc)
    //for (let i = 0; i < arity ** depth * 2; i ++) {
    //const leaf = BigInt(i)
    //newMiTree.insert(leaf)
    //}
    //const newLeaf2 = BigInt(4567)
    //const newLeaves: bigint[] = [newLeaf2]
    //for (let i = 1; i < arity ** depth; i ++) {
    //newLeaves.push(BigInt(i + arity ** depth))
    //}
    //const indexToUpdate2 = arity ** depth
    //newMiTree.update(indexToUpdate2, newLeaf2)
    //const newExpectedRoot = calculateRoot(newLeaves, arity, hashFunc)
    //expect(newMiTree.roots[1].toString()).toEqual(newExpectedRoot.toString())
};
var testGenMerkleProof = function (depth, arity, hashFunc) {
    // Empty tree
    var tree = new OptimisedMT_1.OptimisedMT(depth, ZERO_VALUE, arity, hashFunc);
    var path = tree.genMerklePath(Math.pow(arity, depth) - 1);
    expect(OptimisedMT_1.OptimisedMT.verifyMerklePath(path, hashFunc)).toBeTruthy();
    for (var i = 0; i < Math.pow(arity, depth); i++) {
        var leaf = BigInt(i);
        tree.insert(leaf);
        var path_1 = tree.genMerklePath(i);
        expect(OptimisedMT_1.OptimisedMT.verifyMerklePath(path_1, hashFunc)).toBeTruthy();
    }
    //const miTree = new MultiIncrementalTree(depth, ZERO_VALUE, arity, hashFunc)
    //const iTree = new IncrementalTree(depth, ZERO_VALUE, arity, hashFunc)
    //for (let i = 0; i < arity ** depth; i ++) {
    //const leaf = BigInt(i)
    //miTree.insert(leaf)
    //iTree.insert(leaf)
    //}
    //for (let i = 0; i < arity ** depth; i ++) {
    //const mp = iTree.genMerklePath(i)
    //const mp2 = miTree.genMerklePath(i)
    //expect(IncrementalTree.verifyMerklePath(mp, hashFunc)).toBeTruthy()
    //expect(IncrementalTree.verifyMerklePath(mp2, hashFunc)).toBeTruthy()
    //expect(MultiIncrementalTree.verifyMerklePath(mp, hashFunc)).toBeTruthy()
    //expect(MultiIncrementalTree.verifyMerklePath(mp2, hashFunc)).toBeTruthy()
    //expect(JSON.stringify(stringifyBigInts(mp))
    //).toEqual(
    //JSON.stringify(stringifyBigInts(mp2))
    //)
    //}
    //for (let i = 0; i < arity ** depth; i ++) {
    //const leaf = BigInt(i)
    //miTree.insert(leaf)
    //}
    //for (let i = 0; i < arity ** depth; i ++) {
    //const mp = miTree.genMerklePath(i + arity ** depth)
    //expect(MultiIncrementalTree.verifyMerklePath(mp, hashFunc)).toBeTruthy()
    //}
};
var testGenMerkleSubtreeProof = function (depth, subDepth, arity, hashFunc) {
    var tree = new OptimisedMT_1.OptimisedMT(depth, ZERO_VALUE, arity, hashFunc);
    var subCapacity = Math.pow(arity, subDepth);
    for (var i = 0; i < Math.pow(arity, depth); i++) {
        var leaf = BigInt(i);
        tree.insert(leaf);
    }
    for (var i = 0; i < Math.pow(arity, depth) - subCapacity; i += subCapacity) {
        var start = i;
        var end = start + subCapacity;
        var mp = tree.genMerkleSubrootPath(start, end);
        expect(OptimisedMT_1.OptimisedMT.verifyMerklePath(mp, hashFunc)).toBeTruthy();
        expect(mp.depth).toEqual(depth - subDepth);
        mp.pathElements[0][0] = mp.pathElements[0][0] + BigInt(1);
        expect(OptimisedMT_1.OptimisedMT.verifyMerklePath(mp, hashFunc)).toBeFalsy();
    }
    //const miTree = new MultiIncrementalTree(depth, ZERO_VALUE, arity, hashFunc)
    //const iTree = new IncrementalTree(depth, ZERO_VALUE, arity, hashFunc)
    //const subCapacity = arity ** subDepth
    //for (let i = 0; i < arity ** depth; i ++) {
    //const leaf = BigInt(i)
    //miTree.insert(leaf)
    //iTree.insert(leaf)
    //}
    //for (let i = 0; i < arity ** depth - subCapacity; i += subCapacity) {
    //const start = i
    //const end = start + subCapacity
    //const mp = iTree.genMerkleSubrootPath(start, end)
    //expect(IncrementalTree.verifyMerklePath(mp, hashFunc)).toBeTruthy()
    //const mp2 = miTree.genMerkleSubrootPath(start, end)
    //expect(IncrementalTree.verifyMerklePath(mp, hashFunc)).toBeTruthy()
    //expect(IncrementalTree.verifyMerklePath(mp2, hashFunc)).toBeTruthy()
    //expect(MultiIncrementalTree.verifyMerklePath(mp, hashFunc)).toBeTruthy()
    //expect(MultiIncrementalTree.verifyMerklePath(mp2, hashFunc)).toBeTruthy()
    //expect(JSON.stringify(stringifyBigInts(mp))
    //).toEqual(
    //JSON.stringify(stringifyBigInts(mp2))
    //)
    //expect(mp.depth).toEqual(depth - subDepth)
    //mp.pathElements[0][0] = mp.pathElements[0][0] + BigInt(1)
    //expect(IncrementalTree.verifyMerklePath(mp, hashFunc)).toBeFalsy()
    //expect(MultiIncrementalTree.verifyMerklePath(mp, hashFunc)).toBeFalsy()
    //}
};
var allTests = function (arity, depth, hashFunc, subDepth) {
    it('empty tree', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            testEmpty(depth, arity, hashFunc);
            return [2 /*return*/];
        });
    }); });
    it('insertions', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            testInsertion(depth, arity, hashFunc);
            testInsertion(3, 5, __1.hash5);
            return [2 /*return*/];
        });
    }); });
    it('udpates', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            testUpdate(depth, arity, hashFunc);
            return [2 /*return*/];
        });
    }); });
    it('merkle proof', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            testGenMerkleProof(depth, arity, hashFunc);
            return [2 /*return*/];
        });
    }); });
    it('merkle subtree proof (a)', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            testGenMerkleSubtreeProof(depth, subDepth, arity, hashFunc);
            return [2 /*return*/];
        });
    }); });
    it('merkle subtree proof (b)', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            testGenMerkleSubtreeProof(depth, subDepth, arity, hashFunc);
            return [2 /*return*/];
        });
    }); });
};
describe('Incremental Merkle Tree', function () {
    describe('Arity of 2', function () {
        var arity = 2;
        var depth = 3;
        var subDepth = 2;
        var hashFunc = __1.hash2;
        allTests(arity, depth, hashFunc, subDepth);
    });
    describe('Arity of 5', function () {
        var arity = 5;
        var depth = 3;
        var subDepth = 2;
        var hashFunc = __1.hash5;
        allTests(arity, depth, hashFunc, subDepth);
    });
    it('calcParentIndices', function () {
        testCalcParentIndices(0, 5, 1, [5]);
        testCalcParentIndices(4, 2, 3, [10, 13, 14]);
    });
    it('calcChildIndices', function () {
        testCalcChildIndices(10, 2, 3, [4, 5]);
        testCalcChildIndices(13, 2, 3, [10, 11]);
        testCalcChildIndices(14, 2, 3, [12, 13]);
    });
});
//# sourceMappingURL=OptimisedMT.test.js.map