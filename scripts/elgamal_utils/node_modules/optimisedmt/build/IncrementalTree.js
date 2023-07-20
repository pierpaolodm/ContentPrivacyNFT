"use strict";
exports.__esModule = true;
exports.calculateRoot = exports.MultiIncrementalTree = exports.IncrementalTree = void 0;
var assert = require('assert');
var ff = require('ffjavascript');
var stringifyBigInts = ff.utils.stringifyBigInts;
var unstringifyBigInts = ff.utils.unstringifyBigInts;
var deepCopyBigIntArray = function (arr) {
    return arr.map(function (x) { return BigInt(x.toString()); });
};
var calcInitialVals = function (leavesPerNode, depth, zeroValue, hashFunc) {
    var zeros = [];
    var filledSubtrees = [];
    var filledPaths = {};
    var currentLevelHash = zeroValue;
    for (var i = 0; i < depth; i++) {
        if (i < depth - 1) {
            filledPaths[i] = [];
        }
        zeros.push(currentLevelHash);
        var z = [];
        for (var j = 0; j < leavesPerNode; j++) {
            z.push(zeros[i]);
        }
        filledSubtrees.push(z);
        currentLevelHash = hashFunc(z);
    }
    var root = hashFunc(filledSubtrees[depth - 1]);
    return { zeros: zeros, filledSubtrees: filledSubtrees, filledPaths: filledPaths, root: root };
};
var _insert = function (depth, leavesPerNode, nextIndex, value, filledSubtrees, filledPaths, leaves, zeros, hashFunc) {
    var m = nextIndex % leavesPerNode;
    filledSubtrees[0][m] = value;
    var currentIndex = nextIndex;
    for (var i = 1; i < depth; i++) {
        // currentIndex is the leaf or node's absolute index
        currentIndex = Math.floor(currentIndex / leavesPerNode);
        // m is the leaf's relative position within its node
        m = currentIndex % leavesPerNode;
        if (m === 0) {
            // Zero out the level
            for (var j = 1; j < filledSubtrees[i].length; j++) {
                filledSubtrees[i][j] = zeros[i];
            }
        }
        var z = filledSubtrees[i - 1];
        var hashed = hashFunc(z);
        filledSubtrees[i][m] = hashed;
        if (filledPaths[i - 1].length <= currentIndex) {
            filledPaths[i - 1].push(hashed);
        }
        else {
            filledPaths[i - 1][currentIndex] = hashed;
        }
    }
    leaves.push(value);
};
var _genMerklePath = function (_index, leavesPerNode, depth, leaves, zeros, filledPaths, root) {
    if (_index < 0) {
        throw new Error('The leaf index must be greater than 0');
    }
    if (_index >= leaves.length) {
        throw new Error('The leaf index is too large');
    }
    var pathElements = [];
    var indices = [_index % leavesPerNode];
    var r = Math.floor(_index / leavesPerNode);
    for (var i = 0; i < depth; i++) {
        var s = [];
        if (i === 0) {
            // Get a slice of leaves, padded with zeros
            var leafStartIndex = _index - (_index % leavesPerNode);
            var leafEndIndex = leafStartIndex + leavesPerNode;
            for (var j = leafStartIndex; j < leafEndIndex; j++) {
                if (j < leaves.length) {
                    s.push(leaves[j]);
                }
                else {
                    s.push(zeros[i]);
                }
            }
        }
        else {
            for (var j = 0; j < leavesPerNode; j++) {
                var x = r * leavesPerNode + j;
                if (filledPaths[i - 1].length <= x) {
                    s.push(zeros[i]);
                }
                else {
                    var e = filledPaths[i - 1][x];
                    s.push(e);
                }
            }
        }
        var p = r % leavesPerNode;
        pathElements.push(s);
        if (i < depth - 1) {
            indices.push(p);
        }
        r = Math.floor(r / leavesPerNode);
    }
    // Remove the commitments to elements which are the leaves per level
    var newPe = [[]];
    var firstIndex = _index % leavesPerNode;
    for (var i = 0; i < pathElements[0].length; i++) {
        if (i !== firstIndex) {
            newPe[0].push(pathElements[0][i]);
        }
    }
    for (var i = 1; i < pathElements.length; i++) {
        var level = [];
        for (var j = 0; j < pathElements[i].length; j++) {
            if (j !== indices[i]) {
                level.push(pathElements[i][j]);
            }
        }
        newPe.push(level);
    }
    return {
        pathElements: newPe,
        indices: indices,
        depth: depth,
        root: root,
        leaf: leaves[_index]
    };
};
var _genMerkleSubrootPath = function (_startIndex, // inclusive
_endIndex, // exclusive
leavesPerNode, depth, zeroValue, leaves, zeros, filledSubtrees, filledPaths, root, hashFunc) {
    // The end index must be greater than the start index
    assert(_endIndex > _startIndex);
    var numLeaves = _endIndex - _startIndex;
    // The number of leaves must be a multiple of the tree arity
    assert(numLeaves % leavesPerNode === 0);
    // The number of leaves must be lower than the maximum tree capacity
    assert(numLeaves < Math.pow(leavesPerNode, depth));
    // The number of leaves must the tree arity raised to some positive integer
    var f = false;
    var subDepth;
    for (var i = 0; i < depth; i++) {
        if (numLeaves === Math.pow(leavesPerNode, i)) {
            subDepth = i;
            f = true;
            break;
        }
    }
    assert(f);
    assert(subDepth < depth);
    var leaf = calculateRoot(leaves.slice(_startIndex, _endIndex), leavesPerNode, hashFunc);
    var fullPath = _genMerklePath(_startIndex, leavesPerNode, depth, leaves, zeros, filledPaths, root);
    fullPath.depth = depth - subDepth;
    fullPath.indices = fullPath.indices.slice(subDepth, depth);
    fullPath.pathElements = fullPath.pathElements.slice(subDepth, depth);
    fullPath.leaf = leaf;
    return fullPath;
};
var _verifyMerklePath = function (_proof, _hashFunc) {
    assert(_proof.pathElements);
    var pathElements = _proof.pathElements;
    // Validate the proof format
    assert(_proof.indices);
    for (var i = 0; i < _proof.depth; i++) {
        assert(pathElements[i]);
        assert(_proof.indices[i] != undefined);
    }
    // Hash the first level
    var firstLevel = pathElements[0].map(BigInt);
    firstLevel.splice(Number(_proof.indices[0]), 0, _proof.leaf);
    var currentLevelHash = _hashFunc(firstLevel);
    // Verify the proof
    for (var i = 1; i < pathElements.length; i++) {
        var level = pathElements[i].map(BigInt);
        level.splice(Number(_proof.indices[i]), 0, currentLevelHash);
        currentLevelHash = _hashFunc(level);
    }
    return currentLevelHash === _proof.root;
};
/*
 * An incremental Merkle tree.
 */
var IncrementalTree = /** @class */ (function () {
    function IncrementalTree(_depth, _zeroValue, _leavesPerNode, _hashFunc) {
        // All leaves in the tree
        this.leaves = [];
        // Contains the zero value per level. i.e. zeros[0] is zeroValue,
        // zeros[1] is the hash of leavesPerNode zeros, and so on.
        this.zeros = [];
        // Caches values needed for efficient appends.
        this.filledSubtrees = [];
        // Caches values needed to compute Merkle paths.
        this.filledPaths = {};
        this.leavesPerNode = Number(_leavesPerNode);
        this.depth = Number(_depth);
        assert(this.depth > 0);
        this.nextIndex = 0;
        this.zeroValue = BigInt(_zeroValue);
        this.hashFunc = _hashFunc;
        var r = calcInitialVals(this.leavesPerNode, this.depth, this.zeroValue, this.hashFunc);
        this.filledSubtrees = r.filledSubtrees;
        this.filledPaths = r.filledPaths;
        this.zeros = r.zeros;
        this.root = r.root;
    }
    /*
     * Insert a leaf into the Merkle tree
     * @param _value The value to insert. This may or may not already be
     *               hashed.
     */
    IncrementalTree.prototype.insert = function (_value) {
        // Ensure that _value is a BigInt
        _value = BigInt(_value);
        // A node is one level above the leaf
        // m is the leaf's relative position within its node
        var m = this.nextIndex % this.leavesPerNode;
        if (m === 0) {
            // Zero out the level in filledSubtrees
            for (var j = 1; j < this.filledSubtrees[0].length; j++) {
                this.filledSubtrees[0][j] = this.zeros[0];
            }
        }
        _insert(this.depth, this.leavesPerNode, this.nextIndex, _value, this.filledSubtrees, this.filledPaths, this.leaves, this.zeros, this.hashFunc);
        this.nextIndex++;
        this.root = this.hashFunc(this.filledSubtrees[this.filledSubtrees.length - 1]);
    };
    /*
     * Update the leaf at the specified index with the given value.
     */
    IncrementalTree.prototype.update = function (_index, _value) {
        if (_index >= this.nextIndex || _index >= this.leaves.length) {
            throw new Error('The leaf index specified is too large');
        }
        _value = BigInt(_value);
        var temp = this.leaves;
        temp[_index] = _value;
        this.leaves[_index] = _value;
        var newTree = new IncrementalTree(this.depth, this.zeroValue, this.leavesPerNode, this.hashFunc);
        for (var i = 0; i < temp.length; i++) {
            newTree.insert(temp[i]);
        }
        this.leaves = newTree.leaves;
        this.zeros = newTree.zeros;
        this.filledSubtrees = newTree.filledSubtrees;
        this.filledPaths = newTree.filledPaths;
        this.root = newTree.root;
        this.nextIndex = newTree.nextIndex;
    };
    /*
     * Returns the leaf value at the given index
     */
    IncrementalTree.prototype.getLeaf = function (_index) {
        return this.leaves[_index];
    };
    /*
     * Generates a Merkle proof from a subroot to the root.
     */
    IncrementalTree.prototype.genMerkleSubrootPath = function (_startIndex, // inclusive
    _endIndex) {
        return _genMerkleSubrootPath(_startIndex, _endIndex, this.leavesPerNode, this.depth, this.zeroValue, this.leaves, this.zeros, this.filledSubtrees, this.filledPaths, this.root, this.hashFunc);
    };
    /*  Generates a Merkle proof from a leaf to the root.
     */
    IncrementalTree.prototype.genMerklePath = function (_index) {
        return _genMerklePath(_index, this.leavesPerNode, this.depth, this.leaves, this.zeros, this.filledPaths, this.root);
    };
    /*
     * Return true if the given Merkle path is valid, and false otherwise.
     */
    IncrementalTree.verifyMerklePath = function (_proof, _hashFunc) {
        return _verifyMerklePath(_proof, _hashFunc);
    };
    /*  Deep-copies this object
     */
    IncrementalTree.prototype.copy = function () {
        var newTree = new IncrementalTree(this.depth, this.zeroValue, this.leavesPerNode, this.hashFunc);
        newTree.leaves = deepCopyBigIntArray(this.leaves);
        newTree.zeros = deepCopyBigIntArray(this.zeros);
        newTree.root = this.root;
        newTree.nextIndex = this.nextIndex;
        newTree.filledSubtrees = this.filledSubtrees.map(deepCopyBigIntArray);
        newTree.filledPaths = unstringifyBigInts(JSON.parse(JSON.stringify(stringifyBigInts(this.filledPaths))));
        return newTree;
    };
    IncrementalTree.prototype.equals = function (t) {
        var eq = this.depth === t.depth &&
            this.zeroValue === t.zeroValue &&
            this.leavesPerNode === t.leavesPerNode &&
            this.root === t.root &&
            this.nextIndex === t.nextIndex &&
            this.leaves.length === t.leaves.length &&
            this.filledSubtrees.length === t.filledSubtrees.length;
        this.filledPaths.length === t.filledPaths.length;
        if (!eq) {
            return false;
        }
        for (var i = 0; i < this.leaves.length; i++) {
            if (this.leaves[i] !== t.leaves[i]) {
                return false;
            }
        }
        return true;
    };
    return IncrementalTree;
}());
exports.IncrementalTree = IncrementalTree;
/*
 * Multiple incremental Merkle tree. When a tree is full, the next insertion
 * goes into a new tree.
 */
var MultiIncrementalTree = /** @class */ (function () {
    function MultiIncrementalTree(_depth, _zeroValue, _leavesPerNode, _hashFunc) {
        this.currentTreeNum = 0;
        // All leaves in the tree
        this.leaves = [];
        // Contains the zero value per level. i.e. zeros[0] is zeroValue,
        // zeros[1] is the hash of leavesPerNode zeros, and so on.
        this.zeros = [];
        // Caches values needed for efficient appends.
        this.filledSubtrees = [];
        // Caches values needed to compute Merkle paths.
        this.filledPaths = [];
        this.leavesPerNode = Number(_leavesPerNode);
        this.depth = Number(_depth);
        assert(this.depth > 0);
        this.nextIndex = 0;
        this.zeroValue = BigInt(_zeroValue);
        this.hashFunc = _hashFunc;
        var r = calcInitialVals(this.leavesPerNode, this.depth, this.zeroValue, this.hashFunc);
        this.zeros = r.zeros;
        this.filledSubtrees = [r.filledSubtrees];
        this.filledPaths = [r.filledPaths];
        this.roots = [r.root];
    }
    /*
     * Insert a leaf into the Merkle tree
     * @param _value The value to insert. This may or may not already be
     *               hashed.
     */
    MultiIncrementalTree.prototype.insert = function (_value) {
        if (this.nextIndex >= Math.pow(this.leavesPerNode, this.depth)) {
            this.nextIndex = 0;
            this.currentTreeNum++;
            var r = calcInitialVals(this.leavesPerNode, this.depth, this.zeroValue, this.hashFunc);
            this.zeros = r.zeros;
            this.filledSubtrees.push(r.filledSubtrees);
            this.filledPaths.push(r.filledPaths);
            this.roots.push(r.root);
        }
        // Ensure that _value is a BigInt
        _value = BigInt(_value);
        // A node is one level above the leaf
        // m is the leaf's relative position within its node
        var m = this.nextIndex % this.leavesPerNode;
        if (m === 0) {
            // Zero out the level in filledSubtrees
            for (var j = 1; j < this.leavesPerNode; j++) {
                this.filledSubtrees[this.currentTreeNum][0][j] = this.zeros[0];
            }
        }
        _insert(this.depth, this.leavesPerNode, this.nextIndex, _value, this.filledSubtrees[this.currentTreeNum], this.filledPaths[this.currentTreeNum], this.leaves, this.zeros, this.hashFunc);
        this.nextIndex++;
        this.roots[this.currentTreeNum] = this.hashFunc(this.filledSubtrees[this.currentTreeNum][this.filledSubtrees[this.currentTreeNum].length - 1]);
    };
    /*
     * Update the leaf at the specified index with the given value.
     */
    MultiIncrementalTree.prototype.update = function (_absoluteIndex, _value) {
        if (_absoluteIndex >= this.leaves.length) {
            throw new Error('The leaf index specified is too large');
        }
        _value = BigInt(_value);
        var capacity = Math.pow(this.leavesPerNode, this.depth);
        var treeNum = Math.floor(_absoluteIndex / capacity);
        var subTree = new IncrementalTree(this.depth, this.zeroValue, this.leavesPerNode, this.hashFunc);
        this.leaves[_absoluteIndex] = _value;
        var s = treeNum * capacity;
        for (var i = s; i < s + capacity; i++) {
            if (i >= this.leaves.length) {
                break;
            }
            subTree.insert(this.leaves[i]);
        }
        this.filledPaths[treeNum] = subTree.filledPaths;
        this.filledSubtrees[treeNum] = subTree.filledSubtrees;
        this.roots[treeNum] = subTree.root;
    };
    /*
     * Returns the leaf value at the given index
     */
    MultiIncrementalTree.prototype.getLeaf = function (_index) {
        return this.leaves[_index];
    };
    /*
     * Generates a Merkle proof from a subroot to the root.
     */
    MultiIncrementalTree.prototype.genMerkleSubrootPath = function (_absoluteStartIndex, // inclusive
    _absoluteEndIndex) {
        assert(_absoluteEndIndex > _absoluteStartIndex);
        var capacity = Math.pow(this.leavesPerNode, this.depth);
        var treeNum = Math.floor(_absoluteStartIndex / capacity);
        var leaves = this.leaves.slice(treeNum * capacity, treeNum * capacity + capacity);
        return _genMerkleSubrootPath(_absoluteStartIndex % capacity, _absoluteEndIndex % capacity, this.leavesPerNode, this.depth, this.zeroValue, leaves, this.zeros, this.filledSubtrees[treeNum], this.filledPaths[treeNum], this.roots[treeNum], this.hashFunc);
    };
    /*
     *  Generates a Merkle proof from a leaf to the root.
     */
    MultiIncrementalTree.prototype.genMerklePath = function (_absoluteIndex) {
        var capacity = Math.pow(this.leavesPerNode, this.depth);
        var index = _absoluteIndex % capacity;
        var treeNum = Math.floor(_absoluteIndex / capacity);
        assert(treeNum < this.roots.length);
        return _genMerklePath(index, this.leavesPerNode, this.depth, this.leaves, this.zeros, this.filledPaths[treeNum], this.roots[treeNum]);
    };
    /*
     * Return true if the given Merkle path is valid, and false otherwise.
     */
    MultiIncrementalTree.verifyMerklePath = function (_proof, _hashFunc) {
        return _verifyMerklePath(_proof, _hashFunc);
    };
    /*  Deep-copies this object
     */
    MultiIncrementalTree.prototype.copy = function () {
        var newTree = new MultiIncrementalTree(this.depth, this.zeroValue, this.leavesPerNode, this.hashFunc);
        newTree.leaves = deepCopyBigIntArray(this.leaves);
        newTree.zeros = deepCopyBigIntArray(this.zeros);
        newTree.roots = deepCopyBigIntArray(this.roots);
        newTree.currentTreeNum = this.currentTreeNum;
        newTree.nextIndex = this.nextIndex;
        newTree.filledSubtrees = unstringifyBigInts(JSON.parse(JSON.stringify(stringifyBigInts(this.filledSubtrees))));
        newTree.filledPaths = unstringifyBigInts(JSON.parse(JSON.stringify(stringifyBigInts(this.filledPaths))));
        return newTree;
    };
    MultiIncrementalTree.prototype.equals = function (t) {
        var eq = this.currentTreeNum === t.currentTreeNum &&
            this.depth === t.depth &&
            this.zeroValue === t.zeroValue &&
            this.leavesPerNode === t.leavesPerNode &&
            this.nextIndex === t.nextIndex &&
            this.roots.length === t.roots.length &&
            this.leaves.length === t.leaves.length &&
            JSON.stringify(stringifyBigInts(this.filledPaths)) ===
                JSON.stringify(stringifyBigInts(t.filledPaths)) &&
            JSON.stringify(stringifyBigInts(this.filledSubtrees)) ===
                JSON.stringify(stringifyBigInts(t.filledSubtrees));
        if (!eq) {
            return false;
        }
        for (var i = 0; i < this.roots.length; i++) {
            if (this.roots[i] !== t.roots[i]) {
                return false;
            }
        }
        for (var i = 0; i < this.leaves.length; i++) {
            if (this.leaves[i] !== t.leaves[i]) {
                return false;
            }
        }
        return true;
    };
    return MultiIncrementalTree;
}());
exports.MultiIncrementalTree = MultiIncrementalTree;
/*
 * Calculate a Merkle root given a list of leaves
 */
var calculateRoot = function (leaves, arity, hashFunc) {
    if (leaves.length === 1) {
        return leaves[0];
    }
    assert(leaves.length % arity === 0);
    var hashes = [];
    for (var i = 0; i < leaves.length / arity; i++) {
        var r = [];
        for (var j = 0; j < arity; j++) {
            r.push(leaves[i * arity + j]);
        }
        hashes.push(hashFunc(r));
    }
    return calculateRoot(hashes, arity, hashFunc);
};
exports.calculateRoot = calculateRoot;
//# sourceMappingURL=IncrementalTree.js.map